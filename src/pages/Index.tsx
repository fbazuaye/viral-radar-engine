import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Radar, TrendingUp, Lightbulb, FileText, BarChart3, Search, Check, Coins } from "lucide-react";
import ytradarLogo from "@/assets/ytradar-logo.png";
import { cn } from "@/lib/utils";
import { TIER_TOKENS } from "@/lib/tokenCosts";

const features = [
  { icon: Zap, title: "Viral Radar", desc: "Detect trending content before it peaks" },
  { icon: TrendingUp, title: "Trend Predictions", desc: "AI-powered trend forecasting" },
  { icon: Lightbulb, title: "Idea Generator", desc: "Unlimited content ideas on demand" },
  { icon: FileText, title: "Script Writer", desc: "AI scripts tailored to your style" },
  { icon: BarChart3, title: "Title Optimizer", desc: "Maximize click-through rates" },
  { icon: Search, title: "Keyword Explorer", desc: "Find untapped search opportunities" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tokens: TIER_TOKENS.free,
    features: ["50 tokens/month", "Basic trending topics", "1 title optimization/day", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/mo",
    tokens: TIER_TOKENS.starter,
    features: ["500 tokens/month", "Full trending data", "Competitor tracking (3)", "Video idea generator", "Email support"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    tokens: TIER_TOKENS.pro,
    features: ["2,000 tokens/month", "Viral Prediction Engine", "Competitor tracking (10)", "Script generator", "Content gap finder", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$149",
    period: "/mo",
    tokens: TIER_TOKENS.agency,
    features: ["10,000 tokens/month", "Everything in Pro", "5 team members", "Multi-channel analytics", "API access", "Dedicated manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight font-['Space_Grotesk']">
            YTRadar
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center md:pt-32">
        <div className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          AI-Powered YouTube Growth
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight font-['Space_Grotesk'] md:text-6xl">
          Go viral with
          <span className="text-primary"> data-driven</span> content
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          YTRadar gives you the AI tools to find trends, scan viral content, optimize titles, generate scripts, and outsmart competitors — reach larger audiences and grow your channel, all in one dashboard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/auth?tab=signup">
            <Button size="lg" className="text-base px-8">
              Start Free
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg" className="text-base px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <f.icon className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            Simple Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tight font-['Space_Grotesk'] md:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each plan includes a monthly token allowance. Use tokens for every AI action.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col transition-all hover:scale-[1.02]",
                plan.highlighted
                  ? "border-primary bg-card shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold text-card-foreground">{plan.name}</h3>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary mb-6">
                <Coins className="h-4 w-4" />
                {plan.tokens.toLocaleString()} tokens/mo
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth?tab=signup">
                <Button
                  className={cn(
                    "w-full",
                    plan.highlighted ? "" : ""
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} YTRadar. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
