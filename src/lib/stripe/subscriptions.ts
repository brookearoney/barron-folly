import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./client";
import { getTierFromPriceId, getPriceIdForTier } from "./tiers";
import type { Tier, Organization } from "@/lib/console/types";

// ─── Create Checkout Session ────────────────────────────────────────────

export async function createCheckoutSession(params: {
  orgId: string;
  tier: Tier;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", params.orgId)
    .single();

  if (orgError || !org) {
    throw new Error("Organization not found");
  }

  const organization = org as unknown as Pick<Organization, "id" | "name" | "stripe_customer_id">;

  const priceId = getPriceIdForTier(params.tier);
  if (!priceId) {
    throw new Error(`No Stripe price configured for tier: ${params.tier}`);
  }

  const sessionParams: Record<string, unknown> = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      org_id: params.orgId,
      tier: params.tier,
    },
  };

  if (organization.stripe_customer_id) {
    sessionParams.customer = organization.stripe_customer_id;
  } else {
    sessionParams.customer_creation = "always";
    sessionParams.customer_email = undefined;
    sessionParams.metadata = {
      ...(sessionParams.metadata as Record<string, string>),
      org_name: organization.name,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await stripe.checkout.sessions.create(sessionParams as any);

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  return { url: session.url };
}

// ─── Create Billing Portal Session ──────────────────────────────────────

export async function createBillingPortalSession(params: {
  orgId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, stripe_customer_id")
    .eq("id", params.orgId)
    .single();

  if (orgError || !org) {
    throw new Error("Organization not found");
  }

  const organization = org as unknown as Pick<Organization, "id" | "stripe_customer_id">;

  if (!organization.stripe_customer_id) {
    throw new Error("No Stripe customer linked to this organization");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripe_customer_id,
    return_url: params.returnUrl,
  });

  return { url: session.url };
}

// ─── Sync Subscription Status ───────────────────────────────────────────

export async function syncSubscriptionStatus(stripeCustomerId: string): Promise<void> {
  const stripe = getStripe();
  const admin = createAdminClient();

  // Fetch active subscriptions from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    // No active subscription — downgrade to copper
    await admin
      .from("organizations")
      .update({ tier: "copper", tier_price: 0 })
      .eq("stripe_customer_id", stripeCustomerId);
    return;
  }

  const subscription = subscriptions.data[0];
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) return;

  const tier = getTierFromPriceId(priceId);
  if (!tier) return;

  const price = (subscription.items.data[0]?.price?.unit_amount ?? 0) / 100;

  await admin
    .from("organizations")
    .update({ tier, tier_price: price })
    .eq("stripe_customer_id", stripeCustomerId);
}

// ─── Get Subscription Details ───────────────────────────────────────────

export async function getSubscriptionDetails(orgId: string): Promise<{
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tier: Tier;
  price: number;
} | null> {
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, tier, stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (orgError || !org) return null;

  const organization = org as unknown as Pick<Organization, "id" | "tier" | "stripe_customer_id">;

  if (!organization.stripe_customer_id) return null;

  try {
    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: organization.stripe_customer_id,
      limit: 1,
    });

    if (subscriptions.data.length === 0) return null;

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;
    const tier = priceId ? getTierFromPriceId(priceId) : null;
    const price = (subscription.items.data[0]?.price?.unit_amount ?? 0) / 100;

    // current_period_end is on subscription items in newer API versions
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const periodEndDate = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date().toISOString();

    return {
      status: subscription.status,
      currentPeriodEnd: periodEndDate,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      tier: tier ?? organization.tier,
      price,
    };
  } catch {
    // Stripe not configured or error — return null gracefully
    return null;
  }
}
