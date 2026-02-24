export type DimensionId = "D1" | "D2" | "D3" | "D4";

export type Behavior = {
  id: string;
  dimension: DimensionId;
  name: string;
  weight: number;
  heuristic_patterns: string[];
  min_evidence_words?: number;
  notes?: string;
};

export type Rubric = {
  dimensions: Record<DimensionId, { name: string; weight: number }>;
  behaviors: Behavior[];
  artifact_bias: {
    formula: string;
    thresholds: { high: number; medium: number };
  };
};

export type Evidence = {
  quote: string;
  why: string;
};

export type BehaviorResult = {
  id: string;
  present: boolean;
  confidence: number; // 0..1
  evidence: Evidence[];
};

export type EvaluationResult = {
  overall: number; // 0..100
  dimension_scores: Record<DimensionId, number>;
  artifact_bias_index: number;
  artifact_bias_label: "high" | "medium" | "low";
  behaviors: BehaviorResult[];
  missed_opportunities: Array<{
    behavior_id: string;
    prompt_you_could_have_used: string;
    why_it_matters: string;
  }>;
  practice_plan: Array<{ day: number; task: string; template: string }>;
  prompt_library: Array<{ title: string; template: string }>;
  meta: {
    mode: "transcript" | "challenge";
    created_at_iso: string;
    challenge_id?: string;
    unlocks?: Array<{ card_id: string; at_turn: number; timestamp_iso: string }>;
  };
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp_iso: string;
};

export type Challenge = {
  id: string;
  track: "Coding" | "Writing" | "Research/Fact-check" | "Planning/Ops";
  title: string;
  brief: string;
  success_criteria: string[];
  hidden_context_cards: Array<{
    id: string;
    title: string;
    reveal_if_user_asks_any: string[];
    content: string;
  }>;
  rubric_focus_behavior_ids: string[];
  completion_check: {
    type: "rule_based";
    requires: string[];
  };
};

export type Run = {
  run_id: string;
  mode: "transcript" | "challenge";
  created_at_iso: string;
  input_summary: string;
  messages: ChatMessage[];
  result: EvaluationResult;
};
