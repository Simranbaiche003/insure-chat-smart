import { loadTables } from "./workbook";
import { PricingProfile, PlanQuote } from "@/types";

const round50 = (v: number) => Math.round(v / 50) * 50;

export async function buildRecommendations(p: PricingProfile): Promise<PlanQuote[]> {
  const t = await loadTables();

  // 1) Helpers
  const bmiBucket = (() => {
    const row = t.bmi_buckets.find(
      (r: any) => p.bmi >= +r.min_bmi && p.bmi < +r.max_bmi
    );
    return row?.bucket || "normal";
  })();

  const cityTier = (() => {
    const row = t.city_tier.find((r: any) => r.city?.toLowerCase() === (p.city || "").toLowerCase());
    return row?.tier || "any";
  })();

  const occ = (() => {
    const row = t.occupation_risk.find((r: any) => r.occupation_category === p.occupationCategory);
    return { level: row?.risk_level || "low", loading: +(row?.loading_percent || 0) };
  })();

  // 2) Candidate products
  const candidates = t.products.filter((r: any) => {
    if (r.policy_type !== p.policyType) return false;
    if (p.age < +r.min_age || p.age > +r.max_age) return false;
    if (p.policyType === "family_floater" && r.family_allowed !== "Y") return false;
    return true;
  });

  // 3) For each product, compute premium for nearest >= sum assured
  const results: PlanQuote[] = [];
  for (const prod of candidates) {
    const steps = (prod.sum_assured_steps || "")
      .split(",").map((x: string) => +x.trim()).filter(Boolean).sort((a: number, b: number) => a - b);
    const sa = steps.find((v: number) => v >= p.sumAssured) || steps[steps.length - 1];

    const base = getBasePremium(t, prod.product_id, p, sa, cityTier);
    if (base == null) continue;

    let loaded = base;

    // Loadings (multiplicative)
    const L: Array<number> = [];

    // smoker
    if (p.smoker) L.push(getLoading(t, "smoker", "Y", prod.policy_type));
    // BMI
    if (bmiBucket === "over") L.push(getLoading(t, "bmi_bucket", "over", prod.policy_type));
    if (bmiBucket === "obese") L.push(getLoading(t, "bmi_bucket", "obese", prod.policy_type));
    // occupation
    L.push(getLoading(t, "occupation_risk", occ.level, prod.policy_type));
    // city
    if (cityTier !== "any") L.push(getLoading(t, "city_tier", cityTier, prod.policy_type));
    // conditions default loadings
    for (const c of p.conditions) {
      const row = t.conditions.find((r: any) => r.condition_code === c);
      if (row) L.push(+(row.default_loading_percent || 0));
    }

    // apply loadings
    for (const lp of L.filter(x => x > 0)) loaded = loaded * (1 + lp / 100);

    // family floater multiplier
    if (p.policyType === "family_floater") {
      const fm = t.family_multipliers.find((r: any) => +r.family_size === p.familySize);
      loaded = loaded * (fm ? +fm.multiplier : 1);
    }

    // discounts (end)
    let discounted = loaded;
    const disc = (name: string) => {
      const row = t.discounts.find((r: any) => r.rule_name === name);
      return row ? +row.discount_percent : 0;
    };
    if (p.autopay) discounted *= (1 - disc("autopay_upi") / 100);
    if (p.frequency === "yearly") discounted *= (1 - disc("annual_payment") / 100);

    // convert frequency to annual (cards show per year)
    const annual = discounted; // already annual

    // price range = min (no add‑ons) … max (default recommended add‑ons)
    const addons = (t.addons?.filter((a: any) => a.applies_to === "any" || a.applies_to === prod.product_id) || [
      { name: "Accidental cover", price_annual: 1000, default_recommended: "Y" },
      { name: "Critical illness", price_annual: 1500, default_recommended: "Y" },
      { name: "Worldwide coverage", price_annual: 650, default_recommended: "N" }
    ]).map((a: any) => ({ name: a.name || a.addon_id, price_annual: +a.price_annual, default: (a.default_recommended || "").toUpperCase() === "Y" }));

    const addOnDefaultSum = addons.filter(a => a.default).reduce((s, a) => s + a.price_annual, 0);

    const price_annual_min = round50(annual);
    const price_annual_max = round50(annual + addOnDefaultSum);

    // bullets
    const bullets: string[] = [
      `Hospitalization cover up to ₹${formatINR(sa)}`,
      prod.room_rent_limit ? `Room rent: ${prod.room_rent_limit}` : "",
      (prod.copay_percent !== "" && prod.copay_percent != null) ? `Co‑pay: ${prod.copay_percent}%` : "",
      (prod.outpatient_cover === "Y") ? "OPD/Day‑care cover" : "",
      (prod.maternity_cover === "Y") ? "Maternity cover" : ""
    ].filter(Boolean);

    // tier label for UI
    const tier_label: "Silver" | "Gold" | "Premium" =
      prod.product_id.includes("PLUS") ? "Gold" :
        prod.product_id.includes("PREM") ? "Premium" :
          "Silver";

    const explainers = buildWhy(prod, p, { bmiBucket, smoker: p.smoker, occ, cityTier, conditions: p.conditions });

    results.push({
      product_id: prod.product_id,
      product_name: prod.product_name,
      insurer_name: prod.insurer_name,
      tier_label,
      sum_assured_inr: sa,
      price_annual_min,
      price_annual_max,
      price_monthly_min: round50(price_annual_min / 12),
      price_monthly_max: round50(price_annual_max / 12),
      bullets,
      addons: addons.map(({ name, price_annual }) => ({ name, price_annual })),
      explainers
    });
  }

  // Sort: prefer middle price & more features → then take top 3 as Silver/Gold/Premium columns
  const sorted = results.sort((a, b) => (a.price_annual_min - b.price_annual_min));
  if (sorted.length >= 3) return [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]];
  return sorted.slice(0, 3);
}

function getBasePremium(t: any, product_id: string, p: PricingProfile, sa: number, cityTier: string) {
  if (p.policyType === "life") {
    const row = t.rates_life.find((r: any) =>
      r.product_id === product_id &&
      +r.age_band_min <= p.age && p.age <= +r.age_band_max &&
      +r.sum_assured_inr === sa &&
      +r.term_years === (p.termYears || 10) &&
      r.smoker === "N"
    );
    return row ? +row.base_premium_annual : null;
  }
  // health/family
  const row = t.rates_health.find((r: any) =>
    r.product_id === product_id &&
    +r.age_band_min <= p.age && p.age <= +r.age_band_max &&
    +r.sum_assured_inr === sa &&
    (r.city_tier === "any" || r.city_tier === cityTier) &&
    r.smoker === "N" && r.bmi_bucket === "any"
  );
  return row ? +row.base_premium_annual : null;
}

function getLoading(t: any, dimension: string, value: string, applyTo: string) {
  const row = t.loadings.find((r: any) => r.dimension === dimension && (r.apply_to === applyTo || r.apply_to === "both") && String(r.match_value) === String(value));
  return row ? +row.loading_percent : 0;
}

function buildWhy(prod: any, p: PricingProfile, ctx: any): string[] {
  const why: string[] = [];
  if (p.smoker) why.push("Smoker rate applies.");
  if (ctx.bmiBucket === "over") why.push("Slight BMI loading may apply.");
  if (ctx.bmiBucket === "obese") why.push("High BMI loading may apply.");
  if (p.conditions.includes("diabetes")) why.push("Waiting period/loading likely for diabetes.");
  if (p.policyType === "family_floater" && p.familySize >= 3) why.push("Floater price is based on highest‑risk member and family size.");
  if (prod.maternity_cover === "Y") why.push("Includes maternity benefits.");
  if (prod.outpatient_cover === "Y") why.push("Includes OPD/day‑care cover.");
  return why;
}

function formatINR(n: number) {
  return n.toLocaleString("en-IN");
}