// Tier configuration for waitlist pricing
export const TIER_CONFIG = {
  1: { limit: 100, discount: 60, lifetime: true, label: "Founding Member" },
  2: { limit: 500, discount: 40, lifetime: true, label: "Early Member" },
  3: { limit: Infinity, discount: 0, lifetime: false, label: "Resistance Member" },
} as const;

export type TierNumber = 1 | 2 | 3;

export function getTierForPosition(position: number): TierNumber {
  if (position < TIER_CONFIG[1].limit) return 1;
  if (position < TIER_CONFIG[2].limit) return 2;
  return 3;
}

export function getTierLabel(tier: TierNumber): string {
  return TIER_CONFIG[tier].label;
}

export function getSpotsLeft(total: number): number | null {
  if (total < TIER_CONFIG[1].limit) return TIER_CONFIG[1].limit - total;
  if (total < TIER_CONFIG[2].limit) return TIER_CONFIG[2].limit - total;
  return null;
}
