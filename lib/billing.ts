import { Platform } from "react-native";
import { callEdgeFunction } from "@/lib/edgeFunctions";

export type BillingPlan = "pro_monthly" | "pro_yearly" | "elite_monthly" | "elite_yearly";

export async function startBillingCheckout(plan: BillingPlan) {
  return callEdgeFunction<{ plan: BillingPlan; platform: string }, { checkoutUrl?: string; customerInfo?: unknown }>(
    "fitneo-billing-checkout",
    { plan, platform: Platform.OS }
  );
}

export async function restoreBillingPurchases() {
  return callEdgeFunction<{ platform: string }, { customerInfo?: unknown }>("fitneo-billing-restore", {
    platform: Platform.OS
  });
}
