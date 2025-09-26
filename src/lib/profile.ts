import { IntakeState, PricingProfile } from "@/types";

export function toPricingProfile(s: IntakeState): PricingProfile {
  const age = s.identity?.dob ? calcAge(s.identity.dob) : (s.identity?.yob ? (new Date().getFullYear() - s.identity.yob) : 30);
  const bmi = s.health?.height_cm && s.health?.weight_kg ? (s.health.weight_kg / Math.pow((s.health.height_cm / 100), 2)) : 22;
  const familySize = 1 + (s.family_members?.length || 0);
  const agesAll = [age, ...((s.family_members || []).map(m => m.dob ? calcAge(m.dob) : 30))];

  return {
    policyType: (s.policy?.type || "health") as any,
    age,
    agesAll,
    smoker: (s.health?.smoker === "occasional" || s.health?.smoker === "daily"),
    bmi,
    occupationCategory: s.health?.occupation_category,
    city: s.health?.city, 
    state_ut: s.health?.state_ut,
    conditions: (s.health?.conditions || []).map(c => c.name),
    sumAssured: s.policy?.sum_assured_inr || 500000,
    termYears: s.policy?.term_years || 10,
    frequency: (s.policy?.premium_frequency || "yearly") as any,
    autopay: !!s.policy?.autopay?.vpa,
    familySize
  };
}

function calcAge(dob: string) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}