// Central definition of subscription plans and free-tier limits.
// Imported by both the browser UI and the server API route so the numbers
// never drift apart.

export const FREE_DAILY_GENERATIONS = 5; // main study-set generations per day
export const FREE_SAVED_SETS = 3;        // saved study sets in the library

// A profile row counts as Pro when its plan is "pro". Cancelled-but-still-
// active subscriptions keep plan "pro" until they expire (handled in the
// webhook), so this single check is all the UI needs.
export function isPro(planOrProfile) {
  if (!planOrProfile) return false;
  const plan = typeof planOrProfile === "string" ? planOrProfile : planOrProfile.plan;
  return plan === "pro";
}

export const PRICE = {
  monthly: { amount: "$6.99", period: "/month", note: "Billed monthly" },
  yearly: { amount: "$69.99", period: "/year", note: "2 months free · save 17%" },
};
