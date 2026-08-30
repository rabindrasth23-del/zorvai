import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const waitlistId = pi.metadata?.waitlistId;

    if (waitlistId) {
      const admin = createAdminClient();
      await admin
        .from("waitlist")
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          stripe_session_id: pi.id,
          plan: pi.metadata?.planId,
        })
        .eq("id", waitlistId);

      // TODO: Send payment confirmation email via Resend
    }
  }

  return NextResponse.json({ received: true });
}
