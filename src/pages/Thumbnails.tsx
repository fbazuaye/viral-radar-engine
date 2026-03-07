import { Image, Sparkles, Palette, Type, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const concepts = [
  { style: "Split Comparison", desc: "Before/After with bold dividing line, shocked face on one side", colors: "Red + Yellow", textOverlay: "SHOCKING RESULTS" },
  { style: "Minimalist Focus", desc: "Clean background, single product in center, large bold text", colors: "Black + White + Accent", textOverlay: "The ONE Tool" },
  { style: "Reaction Style", desc: "Expressive face close-up with glowing overlay and emoji", colors: "Purple gradient", textOverlay: "I CAN'T BELIEVE THIS" },
  { style: "Data Visualization", desc: "Chart/graph background with highlighted metric and arrow", colors: "Dark blue + Green", textOverlay: "+500% GROWTH" },
];

const Thumbnails = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <Image className="h-6 w-6 text-primary" />
        Thumbnail Idea Generator
      </h1>
      <p className="text-sm text-muted-foreground mt-1">AI-generated thumbnail concepts for maximum CTR</p>
    </div>

    <div className="flex gap-3">
      <input
        type="text"
        placeholder="Describe your video topic..."
        className="flex-1 h-10 px-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <Button className="gradient-primary text-primary-foreground gap-2">
        <Sparkles className="h-4 w-4" /> Generate
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {concepts.map((c, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="h-32 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-display font-semibold text-card-foreground mb-2">{c.style}</h3>
          <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Palette className="h-3 w-3" /> {c.colors}</span>
            <span className="flex items-center gap-1"><Type className="h-3 w-3" /> "{c.textOverlay}"</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Thumbnails;
