import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncSubscriptionStatus } from "@/lib/stripe/subscriptions";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deduplicate events
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event
  await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const tier = session.metadata?.tier;
        const customerId = session.customer as string;

        if (orgId && customerId) {
          // Link Stripe customer to org
          const updateData: Record<string, unknown> = {
            stripe_customer_id: customerId,
          };

          if (tier) {
            updateData.tier = tier;
          }

          await admin
            .from("organizations")
            .update(updateData)
            .eq("id", orgId);

          // Sync full subscription details
          await syncSubscriptionStatus(customerId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Sync tier from subscription
        await syncSubscriptionStatus(customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to copper
        await admin
          .from("organizations")
          .update({ tier: "copper", tier_price: 0 })
          .eq("stripe_customer_id", customerId);

        // Create admin notification
        const { data: org } = await admin
          .from("organizations")
          .select("id, name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await admin.from("notifications").insert({
            organization_id: org.id,
            type: "status_change",
            title: "Subscription Cancelled",
            body: `${org.name}'s subscription has been cancelled. They have been downgraded to the Copper tier.`,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: org } = await admin
          .from("organizations")
          .select("id, name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (org) {
          await admin.from("notifications").insert({
            organization_id: org.id,
            type: "status_change",
            title: "Payment Failed",
            body: `Payment failed for ${org.name}. Please update payment method to avoid service interruption.`,
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Error processing Stripe webhook ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
