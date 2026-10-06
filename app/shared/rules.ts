import rulesJson from "../../config/compliance-rules.json";

export interface Rules {
  statuses: string[];
  aliases: Record<string, string>;
  banned: string[];
  absolute: string[];
  offPositioning: string[];
  products: Record<string, string>;
  healthWords: string[];
  fabricationPatterns: string[];
  pendingLabel: string;
  nonHuman: string[];
  signatures: Record<string, string[]>;
  highRiskClaims: string[];
}

export const RULES = rulesJson as unknown as Rules;
