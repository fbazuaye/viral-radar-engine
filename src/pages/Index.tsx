import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Lightbulb, FileText, BarChart3, Search } from "lucide-react";

const features = [
  { icon: Zap, title: "Viral Radar", desc: "Detect trending content before it peaks" },
  { icon: TrendingUp, title: "Trend Predictions", desc: "AI-powered trend forecasting" },
  { icon: Lightbulb, title: "Idea Generator", desc: "Unlimited content ideas on demand" },
  { icon: FileText, title: "Script Writer", desc: "AI scripts tailored to your style" },
  { icon: BarChart3, title: "Title Optimizer", desc: "Maximize click-through rates" },
  { icon: Search, title: "Keyword Explorer", desc: "Find untapped search opportunities" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight font-['Space_Grotesk']">
            CreatorPulse
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
          CreatorPulse gives you the AI tools to find trends, optimize titles, generate scripts, and outsmart competitors — all in one dashboard.
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

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CreatorPulse. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
