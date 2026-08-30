import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const PLANS: Record<string, { amount: number; currency: string; label: string }> = {
  student_solo_monthly: { amount: 1999, currency: "usd", label: "Student Solo — Monthly" },
  family_monthly: { amount: 3999, currency: "usd", label: "Family Plan — Monthly" },
  family_annual: { amount: 29900, currency: "usd", label: "Family Plan — Annual" },
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { email, planId } = await request.json();
    const admin = createAdminClient();

    // Verify they're on the waitlist
    const { data: signup } = await admin
      .from("waitlist")
      .select("id, email, name, tier, discount_percent, lifetime_discount, stripe_customer_id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!signup) {
      return NextResponse.json(
        { error: "Please join the waitlist first." },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    // Apply waitlist discount
    const discountMultiplier = 1 - Number(signup.discount_percent) / 100;
    const finalAmount = Math.round(plan.amount * discountMultiplier);

    // Create or retrieve Stripe customer
    let customerId = signup.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: signup.email,
        name: signup.name,
        metadata: {
          waitlistId: signup.id,
          discountPercent: String(signup.discount_percent),
          lifetimeDiscount: String(signup.lifetime_discount),
        },
      });
      customerId = customer.id;

      await admin
        .from("waitlist")
        .update({ stripe_customer_id: customerId })
        .eq("id", signup.id);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: plan.currency,
      customer: customerId,
      metadata: {
        waitlistId: signup.id,
        planId,
        originalAmount: String(plan.amount),
        discountPercent: String(signup.discount_percent),
        lifetimeDiscount: String(signup.lifetime_discount),
      },
      description: `${plan.label} — Zorvai Founding Member (${signup.discount_percent}% off)`,
      receipt_email: signup.email,
    });

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      originalAmount: plan.amount,
      discountPercent: signup.discount_percent,
      currency: plan.currency,
    });
  } catch (err) {
    console.error("Payment intent error:", err);
    return NextResponse.json(
      { error: "Payment setup failed. Please try again." },
      { status: 500 }
    );
  }
}
