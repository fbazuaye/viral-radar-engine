import { Check, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 keyword searches/day", "Basic trending topics", "1 title optimization/day", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    features: ["50 keyword searches/day", "Full trending data", "10 title optimizations/day", "Competitor tracking (3)", "Video idea generator", "Email support"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: ["Unlimited keyword searches", "Viral Prediction Engine", "Unlimited title optimization", "Competitor tracking (10)", "Script generator", "Content gap finder", "Thumbnail ideas", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/month",
    features: ["Everything in Pro", "5 team members", "Multi-channel analytics", "White-label reports", "API access", "Custom integrations", "Dedicated account manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Choose Your Plan
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Scale your YouTube growth with the right tools</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {plans.map((plan, i) => (
        <div key={i} className={cn(
          "rounded-xl border p-5 flex flex-col",
          plan.highlighted ? "border-primary bg-card glow-primary" : "border-border bg-card"
        )}>
          {plan.highlighted && (
            <div className="flex items-center gap-1 text-xs font-medium text-primary mb-2">
              <Zap className="h-3 w-3" /> Most Popular
            </div>
          )}
          <h3 className="font-display text-lg font-bold text-card-foreground">{plan.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-display font-bold text-card-foreground">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {plan.features.map((f, j) => (
              <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button className={cn(
            "w-full",
            plan.highlighted ? "gradient-primary text-primary-foreground" : ""
          )} variant={plan.highlighted ? "default" : "outline"}>
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  </div>
);

export default Pricing;
