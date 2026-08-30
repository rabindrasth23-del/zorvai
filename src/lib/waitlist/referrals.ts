// Referral milestone rewards
export const REFERRAL_MILESTONES = [
  { count: 1, reward: "jump_50", label: "Jump 50 spots" },
  { count: 3, reward: "tier_upgrade", label: "Best tier, even if sold out" },
  { count: 5, reward: "first_month_free", label: "First month free" },
  { count: 10, reward: "founding_member", label: "Founding Resistance Member" },
] as const;

export function getMilestoneStatus(referralCount: number) {
  return REFERRAL_MILESTONES.map((m) => ({
    ...m,
    unlocked: referralCount >= m.count,
  }));
}
