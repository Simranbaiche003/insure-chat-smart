import * as XLSX from "xlsx";
import { Tables } from "@/types";

let cache: Tables | null = null;

export async function loadTables(): Promise<Tables> {
  if (cache) return cache;
  
  try {
    const res = await fetch("/data/insurance_intake_template.xlsx");
    if (!res.ok) {
      // If Excel file doesn't exist, return mock data
      console.warn("Excel file not found, using mock data");
      return getMockTables();
    }
    
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });

    const get = (name: string) =>
      XLSX.utils.sheet_to_json(wb.Sheets[name] || {}, { defval: "" });

    cache = {
      products: get("products"),
      rates_health: get("rates_health"),
      rates_life: get("rates_life"),
      bmi_buckets: get("bmi_buckets"),
      loadings: get("loadings"),
      discounts: get("discounts"),
      family_multipliers: get("family_multipliers"),
      conditions: get("conditions"),
      occupation_risk: get("occupation_risk"),
      city_tier: get("city_tier"),
      options: get("options"),
      config: get("config"),
      recommendations: get("recommendations"),
      documents_required: get("documents_required"),
      addons: wb.Sheets["addons"] ? get("addons") : undefined
    };
    return cache;
  } catch (error) {
    console.warn("Error loading Excel file, using mock data:", error);
    return getMockTables();
  }
}

function getMockTables(): Tables {
  return {
    products: [
      { product_id: "HDFC_HEALTH_BASIC", product_name: "Health Optima", insurer_name: "HDFC ERGO", policy_type: "health", min_age: 18, max_age: 65, family_allowed: "Y", sum_assured_steps: "500000,1000000,2000000", term_options_years: "", room_rent_limit: "2% of SI", copay_percent: "10", pre_existing_wait_months: 48, disease_specific_wait_months: 24, maternity_cover: "Y", outpatient_cover: "N", notes: "Basic health plan" },
      { product_id: "HDFC_HEALTH_PLUS", product_name: "Health Optima Plus", insurer_name: "HDFC ERGO", policy_type: "health", min_age: 18, max_age: 70, family_allowed: "Y", sum_assured_steps: "1000000,2000000,5000000", term_options_years: "", room_rent_limit: "No limit", copay_percent: "5", pre_existing_wait_months: 36, disease_specific_wait_months: 12, maternity_cover: "Y", outpatient_cover: "Y", notes: "Premium health plan" },
      { product_id: "ICICI_HEALTH_PREM", product_name: "Complete Health Insurance", insurer_name: "ICICI Lombard", policy_type: "health", min_age: 18, max_age: 75, family_allowed: "Y", sum_assured_steps: "1000000,2000000,5000000,10000000", term_options_years: "", room_rent_limit: "No limit", copay_percent: "", pre_existing_wait_months: 24, disease_specific_wait_months: 12, maternity_cover: "Y", outpatient_cover: "Y", notes: "Comprehensive coverage" },
      { product_id: "TATA_LIFE_TERM", product_name: "Sampoorna Raksha Supreme", insurer_name: "Tata AIA", policy_type: "life", min_age: 18, max_age: 65, family_allowed: "N", sum_assured_steps: "2500000,5000000,10000000,25000000", term_options_years: "10,15,20,25,30", room_rent_limit: "", copay_percent: "", pre_existing_wait_months: "", disease_specific_wait_months: "", maternity_cover: "N", outpatient_cover: "N", notes: "Term life insurance" }
    ],
    rates_health: [
      { product_id: "HDFC_HEALTH_BASIC", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 500000, base_premium_annual: 8500 },
      { product_id: "HDFC_HEALTH_BASIC", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 1000000, base_premium_annual: 12000 },
      { product_id: "HDFC_HEALTH_BASIC", age_band_min: 36, age_band_max: 50, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 500000, base_premium_annual: 14000 },
      { product_id: "HDFC_HEALTH_PLUS", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 1000000, base_premium_annual: 18000 },
      { product_id: "HDFC_HEALTH_PLUS", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 2000000, base_premium_annual: 25000 },
      { product_id: "ICICI_HEALTH_PREM", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 1000000, base_premium_annual: 22000 },
      { product_id: "ICICI_HEALTH_PREM", age_band_min: 18, age_band_max: 35, smoker: "N", bmi_bucket: "any", city_tier: "any", sum_assured_inr: 2000000, base_premium_annual: 32000 }
    ],
    rates_life: [
      { product_id: "TATA_LIFE_TERM", age_band_min: 18, age_band_max: 35, smoker: "N", sum_assured_inr: 2500000, term_years: 20, base_premium_annual: 8500 },
      { product_id: "TATA_LIFE_TERM", age_band_min: 18, age_band_max: 35, smoker: "N", sum_assured_inr: 5000000, term_years: 20, base_premium_annual: 14000 },
      { product_id: "TATA_LIFE_TERM", age_band_min: 36, age_band_max: 50, smoker: "N", sum_assured_inr: 2500000, term_years: 20, base_premium_annual: 18000 }
    ],
    bmi_buckets: [
      { bucket: "underweight", min_bmi: 0, max_bmi: 18.5 },
      { bucket: "normal", min_bmi: 18.5, max_bmi: 25 },
      { bucket: "over", min_bmi: 25, max_bmi: 30 },
      { bucket: "obese", min_bmi: 30, max_bmi: 50 }
    ],
    loadings: [
      { rule_name: "Smoker Loading", dimension: "smoker", match_value: "Y", loading_percent: 25, apply_to: "both", notes: "Standard smoker loading" },
      { rule_name: "Overweight Loading", dimension: "bmi_bucket", match_value: "over", loading_percent: 10, apply_to: "health", notes: "Overweight loading" },
      { rule_name: "Obesity Loading", dimension: "bmi_bucket", match_value: "obese", loading_percent: 25, apply_to: "health", notes: "Obesity loading" },
      { rule_name: "High Risk Occupation", dimension: "occupation_risk", match_value: "high", loading_percent: 15, apply_to: "both", notes: "High risk occupation" },
      { rule_name: "Very High Risk Occupation", dimension: "occupation_risk", match_value: "very_high", loading_percent: 30, apply_to: "both", notes: "Very high risk occupation" }
    ],
    discounts: [
      { rule_name: "autopay_upi", discount_percent: 5, apply_to: "both", constraints: "UPI autopay setup" },
      { rule_name: "annual_payment", discount_percent: 8, apply_to: "both", constraints: "Annual premium payment" }
    ],
    family_multipliers: [
      { family_size: 1, multiplier: 1.0 },
      { family_size: 2, multiplier: 1.8 },
      { family_size: 3, multiplier: 2.3 },
      { family_size: 4, multiplier: 2.6 },
      { family_size: 5, multiplier: 2.9 }
    ],
    conditions: [
      { condition_code: "diabetes", name: "Diabetes", default_loading_percent: 25, default_wait_months: 48, suggested_docs: "HbA1c, FBS, PPBS", recommended_metrics: "Blood sugar control", severity: "moderate" },
      { condition_code: "hypertension", name: "High Blood Pressure", default_loading_percent: 15, default_wait_months: 24, suggested_docs: "BP readings, ECG", recommended_metrics: "BP control medication", severity: "mild" },
      { condition_code: "asthma", name: "Asthma", default_loading_percent: 20, default_wait_months: 12, suggested_docs: "Pulmonary function test", recommended_metrics: "Inhaler usage", severity: "moderate" }
    ],
    occupation_risk: [
      { occupation_category: "desk_job", risk_level: "low", loading_percent: 0, notes: "Office work, IT, finance" },
      { occupation_category: "manual_labor", risk_level: "medium", loading_percent: 10, notes: "Construction, manufacturing" },
      { occupation_category: "high_risk", risk_level: "high", loading_percent: 20, notes: "Mining, chemicals" },
      { occupation_category: "very_high_risk", risk_level: "very_high", loading_percent: 35, notes: "Armed forces, pilots" }
    ],
    city_tier: [
      { city: "Mumbai", state_ut: "Maharashtra", tier: "1" },
      { city: "Delhi", state_ut: "Delhi", tier: "1" },
      { city: "Bangalore", state_ut: "Karnataka", tier: "1" },
      { city: "Pune", state_ut: "Maharashtra", tier: "2" },
      { city: "Jaipur", state_ut: "Rajasthan", tier: "2" }
    ],
    options: [
      { field: "smoker", options: "never,occasional,daily" },
      { field: "alcohol", options: "none,occasional,regular" },
      { field: "diet", options: "veg,nonveg,mixed" },
      { field: "activity", options: "low,moderate,high" },
      { field: "policy_type", options: "health,life,family_floater" }
    ],
    config: [
      { key: "upi_vpa_regex", value: "^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$" },
      { key: "min_age", value: "18" },
      { key: "max_age", value: "80" },
      { key: "min_sum_assured", value: "100000" },
      { key: "max_sum_assured", value: "50000000" }
    ],
    recommendations: [
      { trigger: "young_professional", message: "Consider higher coverage as your income grows" },
      { trigger: "family_with_children", message: "Family floater plans offer better value" },
      { trigger: "pre_existing_condition", message: "Look for plans with shorter waiting periods" }
    ],
    documents_required: [
      { document_type: "identity", documents: "Aadhaar, PAN, Passport" },
      { document_type: "income", documents: "Salary slips, ITR, Bank statements" },
      { document_type: "medical", documents: "Health checkup, Medical history" }
    ],
    addons: [
      { addon_id: "accidental_cover", name: "Accidental Cover", applies_to: "any", price_annual: 1000, description: "Personal accident cover", default_recommended: "Y" },
      { addon_id: "critical_illness", name: "Critical Illness", applies_to: "any", price_annual: 1500, description: "Critical illness cover", default_recommended: "Y" },
      { addon_id: "worldwide_coverage", name: "Worldwide Coverage", applies_to: "any", price_annual: 650, description: "Emergency treatment abroad", default_recommended: "N" }
    ]
  };
}