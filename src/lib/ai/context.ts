import type { Organization, MemoryLogEntry } from "@/lib/console/types";
import type { SimilarTask } from "./embeddings";

/**
 * Build the organization context block that gets injected into system prompts.
 * This is the cached portion — same across all requests for an org.
 */
export function buildOrgContext(org: Organization): string {
  const sections: string[] = [];

  // Business dossier
  if (org.business_dossier) {
    const d = org.business_dossier;
    sections.push(`== Organization: ${d.name} ==
Industry: ${d.industry}
Business Model: ${d.business_model}
Company Size: ${d.company_size}
Key Products: ${d.key_products.join(", ")}
Tech Stack: ${d.tech_stack.join(", ")}
Operational Complexity: ${d.operational_complexity}
Likely Software Needs: ${d.likely_software_needs.join(", ")}

${d.dossier}`);
  } else {
    sections.push(`== Organization: ${org.name} ==
Tier: ${org.tier}
(No AI dossier available)`);
  }

  return sections.join("\n\n");
}

/**
 * Build the design directive string from the style guide.
 */
export function buildDesignDirective(org: Organization): string {
  if (!org.style_guide) return "(No style guide available)";
  return org.style_guide.design_directive || "(No design directive)";
}

/**
 * Format memory log entries for prompt injection.
 * Caps at the 20 most recent entries.
 */
export function buildMemoryLogContext(memoryLog: MemoryLogEntry[]): string {
  if (!memoryLog || memoryLog.length === 0) {
    return "(No previous work sessions recorded)";
  }

  const recent = memoryLog.slice(-20);
  return recent
    .map(
      (entry, i) =>
        `[${i + 1}] ${entry.timestamp} — "${entry.request_title}"
Summary: ${entry.summary}
Tags: ${entry.tags.join(", ")}
Tasks created: ${entry.task_ids.length}`
    )
    .join("\n\n");
}

/**
 * Format similar tasks from RAG for prompt injection.
 */
export function buildSimilarTasksContext(tasks: SimilarTask[]): string {
  if (!tasks || tasks.length === 0) {
    return "(No similar past tasks found)";
  }

  return tasks
    .map(
      (t, i) =>
        `[Similar Task ${i + 1}] (similarity: ${(t.similarity * 100).toFixed(0)}%)
${t.content}`
    )
    .join("\n\n---\n\n");
}

/**
 * Build the full tech stack string from dossier + accumulated memory.
 */
export function buildTechStackContext(org: Organization): string {
  const stack = new Set<string>();

  if (org.business_dossier?.tech_stack) {
    for (const t of org.business_dossier.tech_stack) {
      stack.add(t);
    }
  }

  // Extract tech-related tags from memory log
  if (org.memory_log) {
    for (const entry of org.memory_log) {
      for (const tag of entry.tags) {
        stack.add(tag);
      }
    }
  }

  return stack.size > 0 ? Array.from(stack).join(", ") : "(No tech stack data)";
}

/**
 * Format the Q&A thread from clarification data for task construction.
 */
export function buildQAThread(
  questions: Array<{ id: string; question: string; answer?: string | null }>
): string {
  return questions
    .map((q) => `Q (${q.id}): ${q.question}\nA: ${q.answer || "(not answered)"}`)
    .join("\n\n");
}
