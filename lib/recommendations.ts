import type { DimensionId, EvaluationResult } from "@/lib/types";

export const PROMPT_LIBRARY: Array<{ title: string; template: string; targets?: DimensionId[] }> = [
  {
    title: "Reviewer Pass (Artifact QA)",
    targets: ["D3", "D4"],
    template:
      "Now act as a reviewer. List (1) hidden assumptions, (2) missing context questions you should have asked me, (3) 3 ways this could be wrong, (4) a quick verification checklist, and (5) what you’re uncertain about."
  },
  {
    title: "Set Terms of Collaboration",
    targets: ["D4"],
    template:
      "Before answering: push back if my assumptions are wrong, ask clarifying questions, and flag what you are uncertain about. Then give me the answer with a short verification plan."
  },
  {
    title: "Edge Case / Failure Mode Probe",
    targets: ["D3"],
    template:
      "Give me 5 edge cases or failure modes for this output, and how to test/verify each one."
  },
  {
    title: "Options + Tradeoffs",
    targets: ["D2", "D3"],
    template:
      "Give me 3 options, each with pros/cons, risks, and your recommendation with rationale."
  },
  {
    title: "Clarify Goal + Constraints",
    targets: ["D1"],
    template:
      "Ask me 5 questions to clarify goal, audience, constraints, success criteria, and preferred format before producing the output."
  }
];

export function buildPracticePlan(result: EvaluationResult): EvaluationResult["practice_plan"] {
  const scores = result.dimension_scores;
  const dims: DimensionId[] = ["D1", "D2", "D3", "D4"];
  const sorted = [...dims].sort((a, b) => scores[a] - scores[b]); // weakest first
  const focus = sorted.slice(0, 2);

  const dayTasks = [
    { day: 1, title: "Clarify goal & success", pick: "Clarify Goal + Constraints" },
    { day: 2, title: "Force options + tradeoffs", pick: "Options + Tradeoffs" },
    { day: 3, title: "Ask missing-context questions", pick: "Set Terms of Collaboration" },
    { day: 4, title: "Probe edge cases / failure modes", pick: "Edge Case / Failure Mode Probe" },
    { day: 5, title: "Run the reviewer pass", pick: "Reviewer Pass (Artifact QA)" },
    { day: 6, title: "Repeat on a real task", pick: "Reviewer Pass (Artifact QA)" },
    { day: 7, title: "Ship with verification checklist", pick: "Set Terms of Collaboration" }
  ];

  const plan = dayTasks.map((d) => {
    const chosen =
      PROMPT_LIBRARY.find((p) => p.title === d.pick) ??
      PROMPT_LIBRARY.find((p) => p.targets?.some((t) => focus.includes(t))) ??
      PROMPT_LIBRARY[0];

    return {
      day: d.day,
      task: `${d.title} (5 minutes)`,
      template: chosen.template
    };
  });

  return plan;
}

export function topPromptTemplates(result: EvaluationResult): EvaluationResult["prompt_library"] {
  const scores = result.dimension_scores;
  const dims: DimensionId[] = ["D1", "D2", "D3", "D4"];
  const sorted = [...dims].sort((a, b) => scores[a] - scores[b]); // weakest first
  const focus = new Set(sorted.slice(0, 2));

  const picks = PROMPT_LIBRARY.filter((p) => p.targets?.some((t) => focus.has(t)));
  const unique = [...new Map(picks.concat(PROMPT_LIBRARY.slice(0, 2)).map((p) => [p.title, p])).values()];
  return unique.slice(0, 6).map(({ title, template }) => ({ title, template }));
}
