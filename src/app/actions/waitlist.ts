"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getWaitlistCount() {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching waitlist count:", error);
    return 0;
  }

  return count || 0;
}

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const referredBy = formData.get("referred_by") as string | null;

  if (!email) {
    return { error: "Email is required" };
  }

  const count = await getWaitlistCount();
  let tier = 3;
  if (count < 100) {
    tier = 1;
  } else if (count < 500) {
    tier = 2;
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
  for (let i = 0; i < 6; i++) {
    referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("waitlist").insert({
    email,
    phone,
    referral_code: referralCode,
    referred_by: referredBy || null,
    tier,
  });

  if (error) {
    console.error("Error joining waitlist:", error);
    if (error.code === "23505") {
      return { error: "This email is already on the waitlist." };
    }
    return { error: "Failed to join waitlist. Please try again." };
  }

  return { success: true, referralCode };
}
