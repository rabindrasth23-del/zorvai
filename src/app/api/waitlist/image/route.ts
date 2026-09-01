import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { referralCode, childName, subject, goal, plan } =
    await request.json();

  const imagePrompt = `Create a premium shareable social media card image for a parent who committed to their child's education through Zorvai AI Tutor.

Vertical format, 9:16 ratio (like an Instagram story).

DESIGN:
- Dark background: deep charcoal #161514
- Soft glowing teal orb (color #4ecdc4 at 15% opacity) in top right
- Subtle warm amber glow bottom left
- Minimal. Premium. Personal. Not corporate.

CONTENT (show exactly as written):
Top: "ZORVAI" in teal, bold, wide letter spacing
Subtitle: "AI Tutor · Commitment Letter"
Thin dividing line

CENTER (large, italic, prominent, warm white):
"I commit to helping ${childName || "my child"} master ${subject}"

Below: pill badge showing the goal: "${goal}"

Below that: plan badge: "${plan || "Founding Member — 60% off forever"}"

Bottom: "zorvai.ca/?ref=${referralCode}" in teal, small

STYLE: Something a proud parent would genuinely want to share.
Beautiful, minimal, personal. Not an advertisement. A commitment.`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            responseMimeType: "text/plain",
          },
        }),
      }
    );

    const data = await geminiResponse.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (p: { inlineData?: { mimeType?: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      throw new Error("No image returned from Gemini");
    }

    const imageBase64: string = imagePart.inlineData.data;
    const mimeType: string = imagePart.inlineData.mimeType;
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const fileName = `commitments/${referralCode}-${Date.now()}.${ext}`;
    const imageBuffer = Buffer.from(imageBase64, "base64");

    const admin = createAdminClient();

    // Try upload, create bucket if needed
    const { error: uploadError } = await admin.storage
      .from("waitlist-images")
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      // Bucket may not exist — try creating it
      await admin.storage.createBucket("waitlist-images", { public: true });
      await admin.storage
        .from("waitlist-images")
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("waitlist-images").getPublicUrl(fileName);

    await admin
      .from("waitlist")
      .update({ commitment_image_url: publicUrl })
      .eq("referral_code", referralCode);

    return NextResponse.json({
      ok: true,
      imageUrl: publicUrl,
      imageBase64: `data:${mimeType};base64,${imageBase64}`,
    });
  } catch (err) {
    console.error("Gemini image error:", err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      imageUrl: null,
    });
  }
}
