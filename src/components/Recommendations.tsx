import { buildRecommendations } from "@/lib/quote";
import { PricingProfile, PlanQuote } from "@/types";
import { useEffect, useState } from "react";
import PlanCard from "./PlanCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type HealthBadge = {
  title: string;
  desc: string;
  variant: "success" | "info" | "warn";
};

export default function Recommendations({ profile }: { profile: PricingProfile }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanQuote[]>([]);
  const [badge, setBadge] = useState<HealthBadge>();

  useEffect(() => {
    setLoading(true);
    buildRecommendations(profile).then(rs => {
      setPlans(rs);
      setBadge(scoreBadge(profile));
    }).finally(() => setLoading(false));
  }, [JSON.stringify(profile)]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <div className="text-lg font-medium">Computing your personalized recommendations...</div>
        <div className="text-sm text-muted-foreground mt-2">
          Analyzing your health profile and finding the best plans for you
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      {/* Health profile banner */}
      {badge && (
        <Card className={`p-6 border-l-4 ${
          badge.variant === "success" 
            ? "border-l-success bg-success-background" 
            : badge.variant === "warn" 
            ? "border-l-warning bg-warning-background" 
            : "border-l-primary bg-primary/5"
        }`}>
          <div className="font-semibold text-lg mb-2">{badge.title}</div>
          <div className="text-sm text-muted-foreground">{badge.desc}</div>
        </Card>
      )}

      {/* Intro text */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">Your Personalized Insurance Recommendations</h2>
        <p className="text-muted-foreground">
          Based on your profile, here are the best‑fit plans and add‑ons. Compare features and choose your preferred option.
        </p>
      </div>

      {/* Plan cards */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <PlanCard key={`${plan.product_id}-${i}`} plan={plan} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-lg font-medium mb-2">No suitable plans found</div>
          <div className="text-sm text-muted-foreground">
            Please contact our team for personalized assistance with your requirements.
          </div>
        </Card>
      )}

      <div className="flex justify-center pt-6">
        <Button size="lg" className="px-8">
          Contact Us for Application
        </Button>
      </div>
    </section>
  );
}

function scoreBadge(p: PricingProfile): HealthBadge {
  const risk = (p.smoker ? 2 : 0) + (p.bmi >= 30 ? 2 : p.bmi >= 25 ? 1 : 0) + (p.conditions.length > 0 ? 2 : 0);
  
  if (risk <= 1) {
    return { 
      title: "Excellent Health Profile", 
      desc: "You qualify for premium plans with comprehensive coverage and benefits.", 
      variant: "success" 
    };
  }
  
  if (risk <= 3) {
    return { 
      title: "Good Health Profile", 
      desc: "Most plans are available with standard waiting periods.", 
      variant: "info" 
    };
  }
  
  return { 
    title: "Needs Attention", 
    desc: "Some plans may have loadings or waiting periods. We'll highlight the best options for you.", 
    variant: "warn" 
  };
}