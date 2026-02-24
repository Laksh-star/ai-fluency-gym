import type { Behavior, ChatMessage, DimensionId, EvaluationResult, Rubric } from "@/lib/types";
import { buildPracticePlan, topPromptTemplates } from "@/lib/recommendations";

const BEHAVIOR_ALIASES: Record<string, string[]> = {
  "D3.missing_context": [
    "what is included",
    "what counts as",
    "compared to what",
    "baseline",
    "before and after",
    "assumptions",
    "what else changed",
    "confounders",
    "attribution"
  ],
  "D3.fact_check_sources": [
    "basis",
    "research",
    "study",
    "studies",
    "proof",
    "supporting data",
    "benchmark",
    "methodology"
  ],
  "D4.verification_checklist": [
    "sanity check",
    "quality check",
    "validation steps",
    "double-check"
  ],
  "D4.uncertainty_limits": [
    "confidence",
    "confidence score",
    "what could change your conclusion"
  ]
};

/**
 * Basic transcript parser:
 * - If lines start with "User:" / "Assistant:", split accordingly
 * - Else treat whole text as user content (single message)
 */
export function parseTranscript(text: string): ChatMessage[] {
  const lines = text.split(/\r?\n/);
  const msgs: ChatMessage[] = [];
  let currentRole: "user" | "assistant" | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!currentRole) return;
    const content = buf.join("\n").trim();
    if (!content) return;
    msgs.push({ role: currentRole, content, timestamp_iso: new Date().toISOString() });
  };

  for (const line of lines) {
    const m = line.match(/^\s*(User|Assistant)\s*:\s*(.*)$/i);
    if (m) {
      flush();
      currentRole = m[1].toLowerCase() === "user" ? "user" : "assistant";
      buf = [m[2] ?? ""];
    } else {
      if (!currentRole) {
        currentRole = "user";
        buf = [];
      }
      buf.push(line);
    }
  }
  flush();

  if (msgs.length === 0) {
    return [{ role: "user", content: text.trim(), timestamp_iso: new Date().toISOString() }];
  }
  return msgs;
}

function wordCount(s: string) {
  return (s.trim().match(/\S+/g) ?? []).length;
}

function normalize(s: string) {
  return s.toLowerCase();
}

function normalizeToken(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(ing|ed|es|s)$/g, "");
}

function tokenize(text: string) {
  return text
    .split(/\s+/)
    .map((t) => normalizeToken(t))
    .filter(Boolean);
}

function isSingleTransposition(a: string, b: string) {
  if (a.length !== b.length || a.length < 2) return false;
  const diff: number[] = [];
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diff.push(i);
    if (diff.length > 2) return false;
  }
  if (diff.length !== 2 || diff[1] !== diff[0] + 1) return false;
  const i = diff[0];
  const j = diff[1];
  return a[i] === b[j] && a[j] === b[i];
}

function withinOneEdit(a: string, b: string) {
  if (a === b) return true;
  if (isSingleTransposition(a, b)) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) {
      i += 1;
    } else if (a.length < b.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  if (i < a.length || j < b.length) edits += 1;
  return edits <= 1;
}

function tokenMatches(textToken: string, patternToken: string) {
  if (textToken === patternToken) return true;
  if (patternToken.length >= 5 && textToken.length >= 5 && withinOneEdit(textToken, patternToken)) return true;
  if (patternToken.length >= 5 && textToken.includes(patternToken)) return true;
  return false;
}

function phraseMatches(textTokens: string[], phrase: string) {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0) return false;

  let hits = 0;
  for (const pt of phraseTokens) {
    if (textTokens.some((tt) => tokenMatches(tt, pt))) hits += 1;
  }

  if (phraseTokens.length <= 2) return hits === phraseTokens.length;
  return hits / phraseTokens.length >= 0.75;
}

function hasAnyToken(textTokens: string[], candidates: string[]) {
  return candidates.some((term) => phraseMatches(textTokens, term));
}

function looksLikeClarifyingQuestion(text: string, textTokens: string[]) {
  const isQuestion = text.includes("?") || hasAnyToken(textTokens, ["what", "why", "how", "which", "where", "when"]);
  if (!isQuestion) return false;

  return hasAnyToken(textTokens, [
    "baseline",
    "included",
    "include",
    "definition",
    "define",
    "assumption",
    "compared",
    "before",
    "after",
    "scope",
    "context",
    "attribution",
    "confounders"
  ]);
}

function looksLikeEvidenceQuestion(text: string, textTokens: string[]) {
  const isQuestion = text.includes("?") || hasAnyToken(textTokens, ["what", "why", "how", "which", "where", "when"]);
  if (!isQuestion) return false;

  return hasAnyToken(textTokens, [
    "source",
    "sources",
    "citation",
    "citations",
    "evidence",
    "research",
    "study",
    "studies",
    "basis",
    "proof",
    "data",
    "benchmark",
    "verify",
    "verified"
  ]);
}

function findEvidenceInUserMessages(messages: ChatMessage[], behavior: Behavior): { hits: string[]; confidence: number } {
  const patterns = [...behavior.heuristic_patterns, ...(BEHAVIOR_ALIASES[behavior.id] ?? [])];
  const hits: string[] = [];

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    const text = msg.content;
    const tnorm = normalize(text);
    const textTokens = tokenize(text);

    let matched = patterns.some((pattern) => {
      if (tnorm.includes(pattern.toLowerCase())) return true;
      return phraseMatches(textTokens, pattern);
    });

    if (!matched && behavior.id === "D3.missing_context") {
      matched = looksLikeClarifyingQuestion(text, textTokens);
    }
    if (!matched && behavior.id === "D3.fact_check_sources") {
      matched = looksLikeEvidenceQuestion(text, textTokens);
    }

    if (matched) {
      // Extract a meaningful quote: up to 240 chars of the user message
      const quote = text.trim().slice(0, 240);
      const baseMinWords = behavior.min_evidence_words ?? 6;
      const isQuestion = text.includes("?") || /^(what|why|how|which|where|when)\b/i.test(text.trim());
      const minWords = isQuestion ? Math.max(3, baseMinWords - 2) : baseMinWords;
      if (wordCount(quote) >= minWords) hits.push(quote);
    }
  }

  // Confidence: scale by number of distinct hits, capped
  const confidence = Math.min(1, hits.length / 2);
  return { hits: Array.from(new Set(hits)).slice(0, 3), confidence };
}

function scoreDimensions(rubric: Rubric, behaviorResults: Array<{ behavior: Behavior; present: boolean; confidence: number }>) {
  const dimIds: DimensionId[] = ["D1", "D2", "D3", "D4"];
  const dimRaw: Record<DimensionId, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
  const dimMax: Record<DimensionId, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };

  for (const b of rubric.behaviors) {
    dimMax[b.dimension] += b.weight;
  }
  for (const br of behaviorResults) {
    const w = br.behavior.weight;
    const add = br.present ? w * br.confidence : 0;
    dimRaw[br.behavior.dimension] += add;
  }

  // Convert to 0..100 per dimension
  const dimScores: Record<DimensionId, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
  for (const d of dimIds) {
    dimScores[d] = dimMax[d] > 0 ? Math.round((dimRaw[d] / dimMax[d]) * 100) : 0;
  }

  // Weighted overall score
  let overall = 0;
  for (const d of dimIds) {
    overall += dimScores[d] * rubric.dimensions[d].weight;
  }
  overall = Math.round(overall);

  return { dimScores, overall };
}

function artifactBiasLabel(index: number, thresholds: { high: number; medium: number }) {
  if (index >= thresholds.high) return "high";
  if (index >= thresholds.medium) return "medium";
  return "low";
}

function buildMissedOpportunities(result: EvaluationResult, rubric: Rubric) {
  const present = new Set(result.behaviors.filter((b) => b.present).map((b) => b.id));
  const opportunities: EvaluationResult["missed_opportunities"] = [];

  // Prioritize a few important behaviors if missing
  const priority = ["D3.missing_context", "D3.fact_check_sources", "D3.ask_reasoning", "D4.verification_checklist", "D4.uncertainty_limits"];
  for (const id of priority) {
    if (present.has(id)) continue;
    const b = rubric.behaviors.find((x) => x.id === id);
    if (!b) continue;
    let prompt = "Ask the model to clarify assumptions and propose a verification plan.";
    let why = "This reduces the risk of accepting polished but wrong outputs.";

    if (id === "D3.missing_context") {
      prompt = "Before answering, ask me 5 clarifying questions and list the assumptions you are making.";
      why = "Spotting missing context is one of the strongest signals of safe, effective collaboration.";
    } else if (id === "D3.fact_check_sources") {
      prompt = "List credible sources to verify each key claim, and summarize where evidence is strong vs weak.";
      why = "When facts matter, verification protects you and your audience.";
    } else if (id === "D3.ask_reasoning") {
      prompt = "Give me your recommendation plus a short rationale and the tradeoffs you considered.";
      why = "Rationale helps you evaluate logic, not just output quality.";
    } else if (id === "D4.verification_checklist") {
      prompt = "Give a quick verification checklist before we finalize.";
      why = "A final QA pass catches errors introduced during iteration.";
    } else if (id === "D4.uncertainty_limits") {
      prompt = "Tell me what you are uncertain about and what would change your conclusion.";
      why = "Uncertainty statements prevent overconfidence and improve decision-making.";
    }

    opportunities.push({ behavior_id: id, prompt_you_could_have_used: prompt, why_it_matters: why });
  }

  return opportunities.slice(0, 5);
}

export function evaluateConversation(params: {
  rubric: Rubric;
  messages: ChatMessage[];
  mode: "transcript" | "challenge";
  meta?: { challenge_id?: string; unlocks?: Array<{ card_id: string; at_turn: number; timestamp_iso: string }>; total_cards?: number };
}): EvaluationResult {
  const { rubric, messages, mode, meta } = params;

  const behaviorResults = rubric.behaviors.map((b) => {
    const { hits, confidence } = findEvidenceInUserMessages(messages, b);
    const present = hits.length > 0;

    return {
      behavior: b,
      id: b.id,
      present,
      confidence: present ? confidence : 0,
      evidence: hits.map((q) => ({ quote: q, why: `Detected signal for: ${b.name}` }))
    };
  });

  // Apply challenge-specific penalty if user didn't unlock any cards
  const totalCards = meta?.total_cards ?? 0;
  const unlockCount = meta?.unlocks?.length ?? 0;
  const hasMissingContext = behaviorResults.find((x) => x.id === "D3.missing_context");
  if (mode === "challenge" && totalCards >= 2 && unlockCount === 0 && hasMissingContext) {
    // Force missing-context to absent-ish with low confidence
    hasMissingContext.present = false;
    hasMissingContext.confidence = 0;
    hasMissingContext.evidence = [];
  }
  if (mode === "challenge" && unlockCount > 0 && hasMissingContext) {
    const coverage = totalCards > 0 ? unlockCount / totalCards : 0.5;
    const unlockConfidence = Math.min(1, Math.max(0.45, 0.35 + coverage));
    if (!hasMissingContext.present || hasMissingContext.confidence < unlockConfidence) {
      hasMissingContext.present = true;
      hasMissingContext.confidence = unlockConfidence;
    }
    const unlockEvidenceQuote = `Unlocked ${unlockCount} hidden context card${unlockCount === 1 ? "" : "s"} by asking clarifying questions.`;
    if (!hasMissingContext.evidence.some((e) => e.quote === unlockEvidenceQuote)) {
      hasMissingContext.evidence.unshift({
        quote: unlockEvidenceQuote,
        why: "Detected signal for: Clarifying-question behavior"
      });
    }
  }

  const scored = scoreDimensions(rubric, behaviorResults.map((x) => ({ behavior: x.behavior, present: x.present, confidence: x.confidence })));
  const D1 = scored.dimScores.D1, D2 = scored.dimScores.D2, D3 = scored.dimScores.D3;
  const biasIndex = Math.round((D1 + D2) - D3);
  const biasLabel = artifactBiasLabel(biasIndex, rubric.artifact_bias.thresholds);

  const result: EvaluationResult = {
    overall: scored.overall,
    dimension_scores: scored.dimScores,
    artifact_bias_index: biasIndex,
    artifact_bias_label: biasLabel,
    behaviors: behaviorResults.map((x) => ({
      id: x.id,
      present: x.present,
      confidence: x.confidence,
      evidence: x.evidence
    })),
    missed_opportunities: [],
    practice_plan: [],
    prompt_library: [],
    meta: {
      mode,
      created_at_iso: new Date().toISOString(),
      challenge_id: meta?.challenge_id,
      unlocks: meta?.unlocks
    }
  };

  result.missed_opportunities = buildMissedOpportunities(result, rubric);
  result.prompt_library = topPromptTemplates(result);
  result.practice_plan = buildPracticePlan(result);

  return result;
}
