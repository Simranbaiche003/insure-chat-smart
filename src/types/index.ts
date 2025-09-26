export type IntakeState = {
  identity: {
    source: "aadhaar_offline_xml" | "aadhaar_secure_qr" | "ocr" | null;
    name?: string; 
    dob?: string; 
    yob?: number;
    gender?: "M"|"F"|"X"; 
    address?: string;
    aadhaar_last4?: string; 
    aadhaar_ref_id?: string; 
    photo_b64?: string;
  };
  contact: { 
    mobile?: string; 
    email?: string; 
  } | null;

  health: {
    height_cm?: number; 
    weight_kg?: number; 
    bmi?: number;
    smoker?: "never"|"occasional"|"daily";
    alcohol?: "none"|"occasional"|"regular";
    diet?: "veg"|"nonveg"|"mixed";
    activity?: "low"|"moderate"|"high";
    conditions: Array<{ 
      name: string; 
      diagnosed_on?: string; 
      medications?: string[]; 
      evidence_doc_id?: string; 
    }>;
    surgeries: Array<{ 
      name: string; 
      year?: number; 
    }>;
    family_history: string[];
    occupation_category?: string;   // maps to occupation_risk sheet
    city?: string; 
    state_ut?: string; // maps to city_tier sheet
  };

  family_members: Array<{
    relation: "spouse"|"child"|"parent";
    name?: string; 
    dob?: string; 
    gender?: "M"|"F"|"X";
    conditions: string[]; 
    medications: string[]; 
    surgeries: string[];
  }>;

  policy: {
    type?: "health"|"life"|"family_floater";
    sum_assured_inr?: number;
    term_years?: number;
    premium_frequency?: "monthly"|"yearly";
    autopay?: { 
      mode?: "upi"; 
      vpa?: string; 
      mandate_id?: string|null; 
    };
  };

  nominee?: { 
    name?: string; 
    relation?: string; 
    dob?: string; 
    aadhaar_last4?: string; 
  };

  consents: {
    purpose_ack?: boolean; 
    ekyc_offline_ok?: boolean;
    data_processing_ok?: boolean; 
    medical_tests_ok?: boolean;
    declarations_ok?: boolean; 
    timestamp?: string;
  };

  audit: Array<{ 
    event: string; 
    by: "user"|"system"; 
    at: string; 
    details?: any; 
  }>;
};

export type PricingProfile = {
  policyType: "health"|"life"|"family_floater";
  age: number;
  agesAll: number[];                // family members (include proposer)
  smoker: boolean;
  bmi: number;                      // computed from height/weight
  occupationCategory?: string;      // maps to occupation_risk
  city?: string; 
  state_ut?: string; // maps to city_tier
  conditions: string[];             // e.g., ["diabetes","hypertension"]
  sumAssured: number;
  termYears?: number;               // for life
  frequency: "monthly"|"yearly";
  autopay: boolean;
  familySize: number;
};

export type PlanQuote = {
  product_id: string;
  product_name: string;
  insurer_name: string;
  tier_label: "Silver"|"Gold"|"Premium";  // for UI badge
  sum_assured_inr: number;
  price_annual_min: number;  // base after loadings/discounts
  price_annual_max: number;  // with recommended add-ons
  price_monthly_min: number;
  price_monthly_max: number;
  bullets: string[];         // base benefits
  addons: Array<{ name: string; price_annual: number }>;
  explainers: string[];      // why recommended
};

export type Tables = {
  products: any[]; 
  rates_health: any[]; 
  rates_life: any[];
  bmi_buckets: any[]; 
  loadings: any[]; 
  discounts: any[];
  family_multipliers: any[]; 
  conditions: any[]; 
  occupation_risk: any[];
  city_tier: any[]; 
  options: any[]; 
  config: any[];
  recommendations: any[]; 
  documents_required: any[]; 
  addons?: any[];
};

export type ChatMessage = {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  chips?: string[];
  file_upload?: {
    type: "aadhaar" | "medical_report";
    filename: string;
    status: "uploading" | "processing" | "success" | "error";
  };
};

export type ViewMode = "chat_only" | "split_view" | "form_only";