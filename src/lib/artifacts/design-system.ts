import type { StyleGuide } from "@/lib/console/types";
import type { Artifact, DesignToken } from "./types";

// ─── Extract Design Tokens from Style Guide ─────────────────────────────────

export function extractDesignTokens(styleGuide: StyleGuide): DesignToken[] {
  const tokens: DesignToken[] = [];

  // Colors
  if (styleGuide.colors) {
    const colorEntries: [string, string][] = [
      ["primary", styleGuide.colors.primary],
      ["secondary", styleGuide.colors.secondary],
      ["accent", styleGuide.colors.accent],
      ["neutral", styleGuide.colors.neutral],
      ["background", styleGuide.colors.background],
      ["text", styleGuide.colors.text],
    ];

    for (const [name, value] of colorEntries) {
      if (value) {
        tokens.push({
          name: `color-${name}`,
          value,
          type: "color",
          category: "brand-colors",
        });
      }
    }
  }

  // Typography
  if (styleGuide.typography) {
    if (styleGuide.typography.heading_font) {
      tokens.push({
        name: "font-heading",
        value: styleGuide.typography.heading_font,
        type: "typography",
        category: "fonts",
      });
    }
    if (styleGuide.typography.body_font) {
      tokens.push({
        name: "font-body",
        value: styleGuide.typography.body_font,
        type: "typography",
        category: "fonts",
      });
    }
    if (styleGuide.typography.scale) {
      tokens.push({
        name: "type-scale",
        value: styleGuide.typography.scale,
        type: "typography",
        category: "scale",
      });
    }
    if (styleGuide.typography.weight_usage) {
      tokens.push({
        name: "font-weights",
        value: styleGuide.typography.weight_usage,
        type: "typography",
        category: "weights",
      });
    }
  }

  return tokens;
}

// ─── Validate Design Compliance ─────────────────────────────────────────────

export function validateDesignCompliance(
  artifact: Artifact,
  styleGuide: StyleGuide
): {
  compliant: boolean;
  violations: Array<{
    token: string;
    expected: string;
    found: string;
    severity: "error" | "warning";
  }>;
  suggestions: string[];
} {
  const violations: Array<{
    token: string;
    expected: string;
    found: string;
    severity: "error" | "warning";
  }> = [];
  const suggestions: string[] = [];
  const content = artifact.content_text || "";

  if (!content) {
    return { compliant: true, violations: [], suggestions: ["No content to validate"] };
  }

  // Check for hardcoded colors that should use design tokens
  if (styleGuide.colors) {
    const hexPattern = /#[0-9a-fA-F]{3,8}/g;
    const hexMatches = content.match(hexPattern) || [];
    const brandColors = [
      styleGuide.colors.primary,
      styleGuide.colors.secondary,
      styleGuide.colors.accent,
      styleGuide.colors.neutral,
      styleGuide.colors.background,
      styleGuide.colors.text,
    ]
      .filter(Boolean)
      .map((c) => c.toLowerCase());

    for (const hex of hexMatches) {
      const normalized = hex.toLowerCase();
      if (!brandColors.includes(normalized)) {
        violations.push({
          token: "color",
          expected: "Brand color or CSS variable",
          found: hex,
          severity: "warning",
        });
      }
    }

    // Check for rgb/rgba values
    const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;
    const rgbMatches = content.match(rgbPattern) || [];
    if (rgbMatches.length > 0) {
      suggestions.push(
        `Found ${rgbMatches.length} inline RGB color(s). Consider using CSS variables or design tokens instead.`
      );
    }
  }

  // Check for hardcoded font families
  if (styleGuide.typography) {
    const fontFamilyPattern = /font-family:\s*["']?([^;"']+)/gi;
    let match;
    while ((match = fontFamilyPattern.exec(content)) !== null) {
      const foundFont = match[1].trim();
      const expectedFonts = [
        styleGuide.typography.heading_font,
        styleGuide.typography.body_font,
      ].filter(Boolean);

      const isExpected = expectedFonts.some(
        (f) => foundFont.toLowerCase().includes(f.toLowerCase())
      );

      if (!isExpected && expectedFonts.length > 0) {
        violations.push({
          token: "font-family",
          expected: expectedFonts.join(" or "),
          found: foundFont,
          severity: "error",
        });
      }
    }
  }

  // Check for px values that could be rem/em (spacing compliance)
  const pxPattern = /:\s*(\d+)px/g;
  let pxMatch;
  let pxCount = 0;
  while ((pxMatch = pxPattern.exec(content)) !== null) {
    const value = parseInt(pxMatch[1], 10);
    // Ignore very small values (1-2px borders)
    if (value > 2) {
      pxCount++;
    }
  }

  if (pxCount > 5) {
    suggestions.push(
      `Found ${pxCount} pixel-based spacing values. Consider using rem/em or Tailwind spacing utilities for consistency.`
    );
  }

  // Check if mobile-first is required
  if (styleGuide.ui_patterns?.mobile_first) {
    const hasMediaQueries = /@media/.test(content);
    const hasResponsiveClasses = /\b(sm:|md:|lg:|xl:)/.test(content);

    if (!hasMediaQueries && !hasResponsiveClasses && content.length > 200) {
      suggestions.push(
        "Style guide requires mobile-first design. Consider adding responsive breakpoints."
      );
    }
  }

  const compliant = violations.filter((v) => v.severity === "error").length === 0;

  return { compliant, violations, suggestions };
}

// ─── Generate Tailwind Config ───────────────────────────────────────────────

export function generateTailwindConfig(styleGuide: StyleGuide): string {
  const config: Record<string, unknown> = {
    theme: {
      extend: {},
    },
  };

  const extend = config.theme as { extend: Record<string, unknown> };

  // Colors
  if (styleGuide.colors) {
    extend.extend.colors = {
      brand: {
        primary: styleGuide.colors.primary,
        secondary: styleGuide.colors.secondary,
        accent: styleGuide.colors.accent,
        neutral: styleGuide.colors.neutral,
        background: styleGuide.colors.background,
        text: styleGuide.colors.text,
      },
    };
  }

  // Typography
  if (styleGuide.typography) {
    extend.extend.fontFamily = {
      heading: [styleGuide.typography.heading_font, "sans-serif"],
      body: [styleGuide.typography.body_font, "sans-serif"],
    };
  }

  return `// Auto-generated Tailwind theme extension from ${styleGuide.messaging?.tagline || "style guide"}
// Do not edit directly - regenerate from style guide

const themeExtension = ${JSON.stringify(config, null, 2)};

export default themeExtension;
`;
}

// ─── Generate CSS Variables ─────────────────────────────────────────────────

export function generateCSSVariables(styleGuide: StyleGuide): string {
  const lines: string[] = [
    "/* Auto-generated CSS custom properties from style guide */",
    "/* Do not edit directly - regenerate from style guide */",
    "",
    ":root {",
  ];

  // Colors
  if (styleGuide.colors) {
    lines.push("  /* Brand Colors */");
    lines.push(`  --color-primary: ${styleGuide.colors.primary};`);
    lines.push(`  --color-secondary: ${styleGuide.colors.secondary};`);
    lines.push(`  --color-accent: ${styleGuide.colors.accent};`);
    lines.push(`  --color-neutral: ${styleGuide.colors.neutral};`);
    lines.push(`  --color-background: ${styleGuide.colors.background};`);
    lines.push(`  --color-text: ${styleGuide.colors.text};`);
    lines.push("");
  }

  // Typography
  if (styleGuide.typography) {
    lines.push("  /* Typography */");
    lines.push(`  --font-heading: '${styleGuide.typography.heading_font}', sans-serif;`);
    lines.push(`  --font-body: '${styleGuide.typography.body_font}', sans-serif;`);

    if (styleGuide.typography.scale) {
      lines.push(`  /* Type scale: ${styleGuide.typography.scale} */`);
    }
    lines.push("");
  }

  lines.push("}");

  return lines.join("\n");
}
