import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * SVG presentation attributes (fill/stroke/stop-color) do not resolve CSS var(),
 * so chart colors are read from the active theme's custom properties instead.
 */
const readVar = (name: string) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;

export const useChartColors = () => {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      primary: readVar("--primary"),
      accent: readVar("--accent"),
      border: readVar("--border"),
      muted: readVar("--muted-foreground"),
      card: readVar("--card"),
      popover: readVar("--popover"),
      popoverForeground: readVar("--popover-foreground"),
      series: [
        readVar("--chart-1"),
        readVar("--chart-2"),
        readVar("--chart-3"),
        readVar("--chart-4"),
        readVar("--chart-5"),
      ],
    }),
    // Re-read on theme flip so charts follow light/dark surfaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
};
