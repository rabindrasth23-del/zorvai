// Claude SVG card prompt builder for waitlist commitment cards
import { getTierLabel, type TierNumber } from "./tiers";

interface CardData {
  name: string;
  childName: string | null;
  commitmentText: string | null;
  commitmentGoal: string | null;
  tier: TierNumber;
  discountPercent: number;
  referralCode: string;
}

export function buildCardPrompt(data: CardData): string {
  const tierLabel =
    data.tier === 1
      ? `Founding Member • ${data.discountPercent}% off forever`
      : data.tier === 2
        ? `Early Member • ${data.discountPercent}% off forever`
        : getTierLabel(3);

  const commitmentLine =
    data.commitmentText ||
    `I commit to helping ${data.childName || "my child"} study smarter`;

  const goalLine = data.commitmentGoal || "Improve this year";

  return `You are a senior UI designer creating a premium shareable card.

Generate a complete, self-contained SVG card for Zorvai's waitlist.

CARD SPECIFICATIONS:
- Format: SVG with viewBox="0 0 540 960" (Instagram Story proportions)
- Style: Minimalist dark premium — like a luxury brand card, not an app screenshot
- Every element must be inside the SVG — no external fonts, no external images

CONTENT TO INCLUDE (exactly as written):
1. Top area: "ZORVAI" in large bold tracking-widest style — color #4ecdc4
2. Below logo: "AI Tutor • ${tierLabel}" — color #8a8680, smaller
3. A thin horizontal line divider — color #2a2826
4. Center large text (this is the commitment): "${commitmentLine}"
   Style: italic, white (#f0ede8), 22px equivalent, centered, max width 420px
5. Below commitment: Goal pill badge:
   "${goalLine}"
   Pill: border 1px #4ecdc4, background rgba(78,205,196,0.1), teal text, rounded
6. Another thin divider
7. Tier badge row: "${tierLabel}"
   Pill with teal border and background
8. Large decorative element: subtle teal orb top-right
   (circle with radial gradient from rgba(78,205,196,0.15) to transparent)
9. Smaller amber orb bottom-left
   (circle with radial gradient from rgba(251,191,36,0.06) to transparent)
10. Subtle grid pattern across the background (lines at 32px intervals, 12% opacity, color #2a2826)
11. Bottom section:
    - "Join me:" label in #8a8680
    - "zorvai.ca/?ref=${data.referralCode}" in #4ecdc4, bold
12. Very bottom: "zorvai.ca" in #5a5753, small

DESIGN RULES:
- Background: rect covering full SVG, fill with linear gradient from #161514 (top) to #0f0e0d (bottom)
- All text: font-family="system-ui, -apple-system, sans-serif"
- Generous padding: nothing within 40px of the edges
- The commitment text in the center is the HERO — make it large and prominent
- No clip art, no emojis rendered as text
- Must look expensive and minimal — lots of breathing room
- The teal color #4ecdc4 appears maximum 3 times — overuse kills the premium feel

Return ONLY valid SVG code.
Start with <svg viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg">
End with </svg>
No explanation. No markdown. No code fences. Just the SVG.`;
}

export function cleanSvgResponse(raw: string): string {
  let svg = raw.trim();

  // Remove markdown fences if Claude wraps them
  if (svg.includes("```")) {
    svg = svg.replace(/```svg\n?/g, "").replace(/```\n?/g, "").trim();
  }

  // Find <svg start
  if (!svg.startsWith("<svg")) {
    const svgStart = svg.indexOf("<svg");
    if (svgStart === -1) throw new Error("Claude did not return valid SVG");
    svg = svg.slice(svgStart);
  }

  return svg;
}
