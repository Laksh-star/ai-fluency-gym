import type { Challenge } from "@/lib/types";

export type UnlockState = Record<string, { at_turn: number; timestamp_iso: string }>;

function nowIso() {
  return new Date().toISOString();
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

function textMatchesTrigger(userText: string, trigger: string) {
  const normalizedText = tokenize(userText).join(" ");
  const normalizedTrigger = tokenize(trigger).join(" ");
  if (!normalizedTrigger) return false;
  if (normalizedText.includes(normalizedTrigger)) return true;

  const textWords = new Set(tokenize(userText));
  const triggerWords = tokenize(trigger);
  if (triggerWords.length === 0) return false;

  let hits = 0;
  for (const w of triggerWords) {
    if (textWords.has(w)) hits += 1;
  }

  if (triggerWords.length <= 2) return hits === triggerWords.length;
  return hits / triggerWords.length >= 0.75;
}

function hasAny(text: string, candidates: string[]) {
  const textTokens = tokenize(text);
  return candidates.some((term) => {
    const termTokens = tokenize(term);
    if (termTokens.length === 0) return false;

    let hits = 0;
    for (const tt of termTokens) {
      if (textTokens.some((x) => tokenMatches(x, tt))) hits += 1;
    }

    if (termTokens.length <= 2) return hits === termTokens.length;
    return hits / termTokens.length >= 0.75;
  });
}

export function uid() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function applyChallengeUnlocks(params: {
  challenge: Challenge;
  currentUnlocked: UnlockState;
  userText: string;
  turnIndex: number;
}) {
  const { challenge, currentUnlocked, userText, turnIndex } = params;
  const next: UnlockState = { ...currentUnlocked };
  const unlockedNow: Array<{ id: string; title: string }> = [];

  for (const card of challenge.hidden_context_cards) {
    if (next[card.id]) continue;
    const matched = card.reveal_if_user_asks_any.some((trigger) => textMatchesTrigger(userText, trigger));
    if (!matched) continue;

    next[card.id] = { at_turn: turnIndex, timestamp_iso: nowIso() };
    unlockedNow.push({ id: card.id, title: card.title });
  }

  return { unlocked: next, unlockedNow };
}

export function buildAssistantReply(params: {
  userText: string;
  unlockedNow: Array<{ id: string; title: string }>;
  recentAssistantMessages?: string[];
}) {
  const { userText, unlockedNow, recentAssistantMessages = [] } = params;
  const lastAssistant = recentAssistantMessages.length > 0
    ? recentAssistantMessages[recentAssistantMessages.length - 1].trim().toLowerCase()
    : "";

  const pickResponse = (candidates: string[]) => {
    if (!lastAssistant) return candidates[0];
    const next = candidates.find((c) => c.trim().toLowerCase() !== lastAssistant);
    return next ?? candidates[0];
  };

  if (unlockedNow.length > 0) {
    const names = unlockedNow.map((x) => x.title).join(", ");
    return pickResponse([
      `Good catch. You unlocked: ${names}. Incorporate this into your assessment, then ask one more question about baseline, definitions, or confounders.`,
      `Nice unlock: ${names}. Use this new context in your summary and ask one additional question about attribution or confounders.`,
      `Great, ${names} is now unlocked. Update your conclusion assumptions and ask one final clarifying question before drafting.`
    ]);
  }

  if (hasAny(userText, ["research", "source", "citation", "evidence", "study", "basis", "proof", "data"])) {
    return pickResponse([
      "Strong direction. Also ask for baseline period, what is included in 'ops costs', and what else changed during the measured window.",
      "Good evidence question. Next ask for baseline definition, scope of ops costs, and confounders during the same timeframe.",
      "Useful start. Pair that with questions on baseline month, cost-inclusion rules, and attribution before concluding."
    ]);
  }

  if (hasAny(userText, ["baseline", "included", "include", "ops costs", "definition", "define"])) {
    return pickResponse([
      "Good clarifying question. Now ask what else changed in the period so you can separate causation from correlation.",
      "That helps. Next ask about confounders and other initiatives running during the same 90 days.",
      "Great. You covered definitions/baseline; now ask for attribution evidence and verification data."
    ]);
  }

  if (hasAny(userText, ["assum", "clarif", "question"])) {
    return pickResponse([
      "Good. Ask 2-3 concrete questions about constraints, definitions, and edge cases. Then propose a plan before drafting.",
      "Nice start. Keep clarifying: ask about baseline, scope, and what changed in parallel.",
      "Good instinct. Gather missing context first, then draft with explicit assumptions."
    ]);
  }

  if (hasAny(userText, ["plan", "steps"])) {
    return pickResponse([
      "Nice. Draft a first version, then run a reviewer pass for missing context, failure modes, and a verification checklist.",
      "Good plan. After drafting, add evidence requirements and a final verification checklist.",
      "Solid structure. Include uncertainty statements and checks before finalizing."
    ]);
  }

  if (hasAny(userText, ["draft", "summary", "memo", "code"])) {
    return pickResponse([
      "Great start. Now list hidden assumptions, add 3 failure modes, add a verification checklist, and state uncertainties.",
      "Nice draft direction. Add assumptions, evidence gaps, and what could change your conclusion.",
      "Good. Add an uncertainty section and explicit verification steps before final output."
    ]);
  }

  return pickResponse([
    "Keep going. Ask one question about definitions, one about baseline, and one about attribution before finalizing.",
    "Progressing well. Next clarify scope, baseline period, and potential confounders.",
    "Keep pushing context quality: definition, baseline, attribution, then summarize cautiously."
  ]);
}
