import { Check, CreditCard, Zap, Coins, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOKEN_COSTS, TIER_TOKENS, TOKEN_PACKS } from "@/lib/tokenCosts";
import { useTokenBalance } from "@/hooks/useTokenBalance";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tokens: TIER_TOKENS.free,
    features: ["5 keyword searches/day", "Basic trending topics", "1 title optimization/day", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    tokens: TIER_TOKENS.starter,
    features: ["50 keyword searches/day", "Full trending data", "10 title optimizations/day", "Competitor tracking (3)", "Video idea generator", "Email support"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    tokens: TIER_TOKENS.pro,
    features: ["Unlimited keyword searches", "Viral Prediction Engine", "Unlimited title optimization", "Competitor tracking (10)", "Script generator", "Content gap finder", "Thumbnail ideas", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/month",
    tokens: TIER_TOKENS.agency,
    features: ["Everything in Pro", "5 team members", "Multi-channel analytics", "White-label reports", "API access", "Custom integrations", "Dedicated account manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  const { data: balance } = useTokenBalance();

  return (
    <div className="space-y-8">
      {/* Current Balance */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">Your Token Balance</p>
          <p className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Coins className="h-7 w-7 text-primary" />
            {(balance ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-1">
          {Object.entries(TOKEN_COSTS).map(([key, { cost, label }]) => (
            <div key={key}>{label}: <span className="font-medium text-foreground">{cost} tokens</span></div>
          ))}
        </div>
      </div>

      {/* Subscription Tiers */}
      <div>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Choose Your Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Each plan includes a monthly token allowance</p>
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
              <div className="mt-2 mb-1">
                <span className="text-3xl font-display font-bold text-card-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-primary font-medium mb-4">
                <Coins className="h-3.5 w-3.5" />
                {plan.tokens.toLocaleString()} tokens/mo
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

      {/* Token Packs */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-xl font-display font-bold text-foreground flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Need More Tokens?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Purchase additional token packs anytime</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {TOKEN_PACKS.map((pack, i) => (
            <div key={i} className={cn(
              "rounded-xl border p-5 text-center",
              pack.popular ? "border-primary bg-card glow-primary" : "border-border bg-card"
            )}>
              {pack.popular && (
                <div className="text-xs font-medium text-primary mb-2">Best Value</div>
              )}
              <div className="flex items-center justify-center gap-1 text-2xl font-display font-bold text-card-foreground mb-1">
                <Coins className="h-5 w-5 text-primary" />
                {pack.label}
              </div>
              <p className="text-2xl font-display font-bold text-card-foreground">${pack.price}</p>
              <p className="text-xs text-muted-foreground mb-4">
                ${(pack.price / pack.tokens * 100).toFixed(1)}¢ per token
              </p>
              <Button variant={pack.popular ? "default" : "outline"} className={cn("w-full", pack.popular && "gradient-primary text-primary-foreground")}>
                Buy Now
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
