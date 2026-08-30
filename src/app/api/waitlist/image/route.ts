import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { buildCardPrompt, cleanSvgResponse } from "@/lib/waitlist/image-generator";
import type { TierNumber } from "@/lib/waitlist/tiers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();
    const admin = createAdminClient();

    // Get signup details
    const { data: signup, error: fetchError } = await admin
      .from("waitlist")
      .select("*")
      .eq("referral_code", referralCode)
      .single();

    if (fetchError || !signup) {
      return NextResponse.json({ error: "Signup not found." }, { status: 404 });
    }

    // Build the Claude prompt
    const prompt = buildCardPrompt({
      name: signup.name,
      childName: signup.child_name,
      commitmentText: signup.commitment_text,
      commitmentGoal: signup.commitment_goal,
      tier: signup.tier as TierNumber,
      discountPercent: signup.discount_percent,
      referralCode: signup.referral_code,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const svgCode = cleanSvgResponse(
      response.content[0].type === "text" ? response.content[0].text : ""
    );

    // Upload SVG to Supabase Storage
    const fileName = `cards/${referralCode}-${Date.now()}.svg`;
    const { error: uploadError } = await admin.storage
      .from("waitlist-images")
      .upload(fileName, Buffer.from(svgCode), {
        contentType: "image/svg+xml",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = admin.storage.from("waitlist-images").getPublicUrl(fileName);

    // Save URL to signup record
    await admin
      .from("waitlist")
      .update({ commitment_image_url: publicUrl })
      .eq("referral_code", referralCode);

    return NextResponse.json({
      ok: true,
      imageUrl: publicUrl,
      svgCode,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate card. Please try again." },
      { status: 500 }
    );
  }
}
