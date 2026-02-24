import rubricJson from "@/data/fluency_taxonomy.json";
import type { Rubric } from "@/lib/types";

export const rubric = rubricJson as Rubric;

export function getBehaviorById(id: string) {
  return rubric.behaviors.find((b) => b.id === id);
}
