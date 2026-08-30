import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const PLANS: Record<string, { amount: number; currency: string; label: string }> = {
  student_solo_monthly: { amount: 2900, currency: "usd", label: "Student Solo — Monthly" },
  family_monthly: { amount: 4900, currency: "usd", label: "Family Plan — Monthly" },
  family_annual: { amount: 39900, currency: "usd", label: "Family Plan — Annual" },
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

    // Create Stripe Checkout Session (redirect-based — works everywhere)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zorvai.vercel.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            unit_amount: finalAmount,
            product_data: {
              name: plan.label,
              description: `Zorvai Founding Member — ${signup.discount_percent}% lifetime discount`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        waitlistId: signup.id,
        planId,
        originalAmount: String(plan.amount),
        discountPercent: String(signup.discount_percent),
        lifetimeDiscount: String(signup.lifetime_discount),
      },
      success_url: `${appUrl}/waitlist?paid=true&email=${encodeURIComponent(signup.email)}`,
      cancel_url: `${appUrl}/waitlist?cancelled=true`,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
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
