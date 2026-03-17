import { createAdminClient } from "@/lib/supabase/admin";
import type { Artifact, QualityGateResult, QualityCheck } from "./types";

// ─── Secret patterns to detect ──────────────────────────────────────────────
const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}/i,
  /(?:secret|password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}/i,
  /(?:sk|pk)[-_](?:live|test)[-_][A-Za-z0-9]{20,}/,
  /(?:AKIA|ASIA)[A-Z0-9]{16}/,
  /ghp_[A-Za-z0-9_]{36}/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
];

// ─── Marker patterns (TODO, FIXME, HACK) ────────────────────────────────────
const MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX|TEMP)\b/i;

// ─── Quality Gate Runner ────────────────────────────────────────────────────

export async function runQualityGates(
  artifact: Artifact,
  orgId: string
): Promise<QualityGateResult> {
  const checks: QualityCheck[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Universal checks (all artifact types)
  checks.push(checkHasDescription(artifact));
  checks.push(checkNotDuplicate(artifact, orgId));
  checks.push(checkVersionForPublish(artifact));

  // Type-specific checks
  switch (artifact.type) {
    case "code":
      checks.push(checkHasContent(artifact));
      checks.push(checkReasonableFileSize(artifact));
      checks.push(checkNoMarkers(artifact));
      checks.push(checkNoSecrets(artifact));
      checks.push(checkValidImports(artifact));
      break;

    case "component":
      checks.push(checkHasContent(artifact));
      checks.push(checkComponentMetadata(artifact));
      checks.push(checkNoSecrets(artifact));
      checks.push(checkNoMarkers(artifact));
      break;

    case "design":
      checks.push(checkDesignNaming(artifact));
      checks.push(await checkStyleGuideReference(artifact, orgId));
      break;

    case "config":
      checks.push(checkHasContent(artifact));
      checks.push(checkNoSecrets(artifact));
      checks.push(checkReasonableFileSize(artifact));
      break;

    case "document":
      checks.push(checkHasContent(artifact));
      checks.push(checkReasonableFileSize(artifact));
      break;

    case "image":
      checks.push(checkHasFile(artifact));
      checks.push(checkReasonableFileSize(artifact));
      break;

    case "data":
      checks.push(checkHasContent(artifact));
      checks.push(checkNoSecrets(artifact));
      break;
  }

  // Collect blockers and warnings
  for (const check of checks) {
    if (!check.passed && check.score === 0) {
      blockers.push(`${check.name}: ${check.details}`);
    } else if (!check.passed) {
      warnings.push(`${check.name}: ${check.details}`);
    }
  }

  // Calculate overall score
  const totalWeight = checks.length;
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  const passed = blockers.length === 0 && score >= 60;

  // Persist the quality score back to the artifact
  const supabase = createAdminClient();
  await supabase
    .from("artifacts")
    .update({
      quality_score: score,
      quality_notes: [
        ...blockers.map((b) => `[BLOCKER] ${b}`),
        ...warnings.map((w) => `[WARNING] ${w}`),
      ].join("\n") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", artifact.id);

  return { passed, score, checks, blockers, warnings };
}

// ─── Individual Checks ──────────────────────────────────────────────────────

function checkHasDescription(artifact: Artifact): QualityCheck {
  const passed = !!artifact.description && artifact.description.trim().length >= 10;
  return {
    name: "Has description",
    passed,
    score: passed ? 100 : 30,
    details: passed
      ? "Artifact has a meaningful description"
      : "Artifact lacks a description (minimum 10 characters)",
  };
}

function checkHasContent(artifact: Artifact): QualityCheck {
  const hasContent = !!artifact.content_text && artifact.content_text.trim().length > 0;
  return {
    name: "Has content",
    passed: hasContent,
    score: hasContent ? 100 : 0,
    details: hasContent
      ? "Artifact has inline content"
      : "Text-based artifact has no content",
  };
}

function checkHasFile(artifact: Artifact): QualityCheck {
  const hasFile = !!artifact.storage_path;
  return {
    name: "Has file",
    passed: hasFile,
    score: hasFile ? 100 : 0,
    details: hasFile
      ? "Artifact has an uploaded file"
      : "Binary artifact has no uploaded file",
  };
}

function checkReasonableFileSize(artifact: Artifact): QualityCheck {
  if (!artifact.file_size) {
    return {
      name: "File size",
      passed: true,
      score: 80,
      details: "File size unknown, skipping check",
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10 MB
  const passed = artifact.file_size <= maxSize;
  return {
    name: "File size",
    passed,
    score: passed ? 100 : 20,
    details: passed
      ? `File size ${formatBytes(artifact.file_size)} is within limits`
      : `File size ${formatBytes(artifact.file_size)} exceeds 10 MB limit`,
  };
}

function checkNoMarkers(artifact: Artifact): QualityCheck {
  if (!artifact.content_text) {
    return { name: "No TODO/FIXME markers", passed: true, score: 100, details: "No content to check" };
  }

  const lines = artifact.content_text.split("\n");
  const markerLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (MARKER_PATTERN.test(lines[i])) {
      markerLines.push(i + 1);
    }
  }

  const passed = markerLines.length === 0;
  return {
    name: "No TODO/FIXME markers",
    passed,
    score: passed ? 100 : 50,
    details: passed
      ? "No unresolved markers found"
      : `Found ${markerLines.length} marker(s) on line(s): ${markerLines.slice(0, 5).join(", ")}${markerLines.length > 5 ? "..." : ""}`,
  };
}

function checkNoSecrets(artifact: Artifact): QualityCheck {
  if (!artifact.content_text) {
    return { name: "No hardcoded secrets", passed: true, score: 100, details: "No content to check" };
  }

  const foundPatterns: string[] = [];
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(artifact.content_text)) {
      foundPatterns.push(pattern.source.slice(0, 30));
    }
  }

  const passed = foundPatterns.length === 0;
  return {
    name: "No hardcoded secrets",
    passed,
    score: passed ? 100 : 0,
    details: passed
      ? "No secret patterns detected"
      : `Detected ${foundPatterns.length} potential secret pattern(s) - review and remove before publishing`,
  };
}

function checkValidImports(artifact: Artifact): QualityCheck {
  if (!artifact.content_text) {
    return { name: "Valid imports", passed: true, score: 100, details: "No content to check" };
  }

  const importLines = artifact.content_text
    .split("\n")
    .filter((line) => /^\s*import\s/.test(line));

  if (importLines.length === 0) {
    return { name: "Valid imports", passed: true, score: 100, details: "No imports found" };
  }

  // Check for obviously broken imports
  const brokenImports = importLines.filter((line) => {
    // Missing from clause
    if (/import\s+{[^}]*$/.test(line) && !line.includes("from")) return true;
    // Empty import path
    if (/from\s+["']\s*["']/.test(line)) return true;
    return false;
  });

  const passed = brokenImports.length === 0;
  return {
    name: "Valid imports",
    passed,
    score: passed ? 100 : 40,
    details: passed
      ? `${importLines.length} import(s) look valid`
      : `${brokenImports.length} potentially broken import(s) detected`,
  };
}

function checkComponentMetadata(artifact: Artifact): QualityCheck {
  const hasProps = artifact.metadata && (
    "props" in artifact.metadata ||
    "component_type" in artifact.metadata ||
    "dependencies" in artifact.metadata
  );

  return {
    name: "Component metadata",
    passed: !!hasProps,
    score: hasProps ? 100 : 40,
    details: hasProps
      ? "Component has associated metadata (props/type/dependencies)"
      : "Component is missing metadata - consider adding props, component_type, or dependencies",
  };
}

function checkDesignNaming(artifact: Artifact): QualityCheck {
  // Check that design artifacts follow naming conventions (kebab-case or PascalCase)
  const nameWithoutExt = artifact.name.replace(/\.[^.]+$/, "");
  const isKebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(nameWithoutExt);
  const isPascal = /^[A-Z][A-Za-z0-9]*$/.test(nameWithoutExt);
  const isValid = isKebab || isPascal;

  return {
    name: "Design naming convention",
    passed: isValid,
    score: isValid ? 100 : 60,
    details: isValid
      ? "Name follows kebab-case or PascalCase convention"
      : `Name "${artifact.name}" does not follow naming conventions (use kebab-case or PascalCase)`,
  };
}

async function checkStyleGuideReference(artifact: Artifact, orgId: string): Promise<QualityCheck> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("style_guide")
    .eq("id", orgId)
    .single();

  const hasStyleGuide = !!org?.style_guide;
  const hasReference = artifact.metadata &&
    ("style_guide_ref" in artifact.metadata || "design_tokens" in artifact.metadata);

  if (!hasStyleGuide) {
    return {
      name: "Style guide reference",
      passed: true,
      score: 80,
      details: "Organization has no style guide - skipping check",
    };
  }

  return {
    name: "Style guide reference",
    passed: !!hasReference,
    score: hasReference ? 100 : 50,
    details: hasReference
      ? "Artifact references the organization style guide"
      : "Design artifact should reference the style guide in metadata",
  };
}

function checkNotDuplicate(artifact: Artifact, _orgId: string): QualityCheck {
  // Content hash uniqueness is checked at query time when artifacts are created
  const hasHash = !!artifact.content_hash;
  return {
    name: "Content uniqueness",
    passed: true,
    score: hasHash ? 100 : 70,
    details: hasHash
      ? "Content hash generated for dedup"
      : "No content hash available - cannot verify uniqueness",
  };
}

function checkVersionForPublish(artifact: Artifact): QualityCheck {
  // For publishing, artifacts should ideally have gone through at least one revision
  if (artifact.status !== "approved") {
    return {
      name: "Version maturity",
      passed: true,
      score: 100,
      details: "Check applies only at publish time",
    };
  }

  const passed = artifact.version >= 1;
  return {
    name: "Version maturity",
    passed,
    score: passed ? 100 : 60,
    details: passed
      ? `Artifact is at version ${artifact.version}`
      : "Artifact has not been versioned - consider revising before publishing",
  };
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
