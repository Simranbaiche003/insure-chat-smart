import { PlanQuote } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PlanCard({ plan }: { plan: PlanQuote }) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "bg-slate-100 text-slate-800";
      case "Gold":
        return "bg-warning-background text-warning-foreground";
      case "Premium":
        return "bg-primary/10 text-primary";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="px-6 pt-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">{plan.insurer_name}</div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{plan.product_name}</h3>
            <Badge className={getTierColor(plan.tier_label)}>
              {plan.tier_label} Plan
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            ₹{plan.price_annual_min.toLocaleString("en-IN")} – ₹{plan.price_annual_max.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-muted-foreground">per year</div>
          <div className="text-sm text-muted-foreground mt-1">
            (₹{plan.price_monthly_min.toLocaleString("en-IN")} – ₹{plan.price_monthly_max.toLocaleString("en-IN")}/month)
          </div>
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="text-sm font-medium text-muted-foreground mb-3">Base Benefits:</div>
        <ul className="text-sm space-y-2">
          {plan.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 mt-4">
        <div className="text-sm font-medium text-muted-foreground mb-3">Add‑ons (Extra Cost):</div>
        <div className="flex flex-wrap gap-2">
          {plan.addons.map((addon, i) => (
            <div key={i} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs">
              <span>{addon.name}</span>
              <span className="text-muted-foreground">+ ₹{addon.price_annual.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>

      {plan.explainers.length > 0 && (
        <div className="px-6 mt-4 text-xs text-muted-foreground">
          <div className="mb-1">
            <span className="font-medium">Why this plan:</span>
          </div>
          <div>{plan.explainers.join(" ")}</div>
        </div>
      )}

      <div className="mt-auto p-6">
        <Button className="w-full" size="lg">
          Choose {plan.tier_label} Plan
        </Button>
      </div>
    </Card>
  );
}