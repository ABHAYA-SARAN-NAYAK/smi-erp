import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type StatCardCategory = "sales" | "gst" | "receivables" | "jobwork" | "labour" | "primary" | "secondary" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  badge?: {
    text: string;
    variant?: "danger" | "warning" | "success" | "neutral";
  };
  icon?: React.ReactNode;
  category?: StatCardCategory;
  isHero?: boolean;
  heroVariant?: "orange" | "violet" | "danger";
  className?: string;
}

const CATEGORY_STYLES: Record<StatCardCategory, {
  cardClass: string;
  iconGlowClass: string;
}> = {
  sales: {
    cardClass: "glow-card-orange",
    iconGlowClass: "icon-glow-orange",
  },
  primary: {
    cardClass: "glow-card-orange",
    iconGlowClass: "icon-glow-orange",
  },
  gst: {
    cardClass: "glow-card-violet",
    iconGlowClass: "icon-glow-violet",
  },
  secondary: {
    cardClass: "glow-card-violet",
    iconGlowClass: "icon-glow-violet",
  },
  receivables: {
    cardClass: "glow-card-red",
    iconGlowClass: "icon-glow-red",
  },
  jobwork: {
    cardClass: "glow-card-blue",
    iconGlowClass: "icon-glow-blue",
  },
  labour: {
    cardClass: "glow-card-green",
    iconGlowClass: "icon-glow-green",
  },
  neutral: {
    cardClass: "glow-card-base",
    iconGlowClass: "bg-[#21232c] text-[#8b8fa3] border border-[#2a2d38]",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  badge,
  icon,
  category = "neutral",
  isHero = false,
  heroVariant = "orange",
  className,
}: StatCardProps) {
  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.neutral;

  // Solid/Full Gradient Hero Card (Feature Highlight Card)
  if (isHero) {
    return (
      <div
        className={cn(
          "rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300",
          heroVariant === "orange" && "glow-card-hero-orange",
          heroVariant === "danger" && "glow-card-hero-danger",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
            {title}
          </span>
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg">
              {icon}
            </div>
          )}
        </div>

        <div className="my-1">
          <div className="text-3xl sm:text-4xl font-extrabold font-display tabular-nums tracking-tight text-white drop-shadow-sm">
            {value}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
          <span className="truncate">{subtitle || "Hero Metric"}</span>
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white text-[#121317] rounded-md shadow-xs">
              {badge.text}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Glow Card with Top-Left Radial Light Source
  return (
    <div
      className={cn(
        "rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300",
        catStyle.cardClass,
        className
      )}
    >
      {/* Top Header: Title + Glowing Icon Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b8fa3]">
          {title}
        </span>
        {icon && (
          <div className={cn("w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105", catStyle.iconGlowClass)}>
            {icon}
          </div>
        )}
      </div>

      {/* Main Numeric Statement */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#E9ECEF] tabular-nums tracking-tight">
          {value}
        </div>
        {badge && (
          <span
            className={cn(
              "px-2.5 py-0.5 text-[11px] font-bold rounded-md border shadow-xs whitespace-nowrap",
              badge.variant === "danger" && "bg-rose-500/20 text-rose-400 border-rose-500/40",
              badge.variant === "warning" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
              badge.variant === "success" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
              (!badge.variant || badge.variant === "neutral") && "bg-[#21232c] text-[#8b8fa3] border-[#2a2d38]"
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Subtitle & Trend Indicator */}
      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-[#2a2d38]/80 flex items-center gap-2 text-xs text-[#8b8fa3]">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-bold px-1.5 py-0.5 rounded-md text-[11px] gap-0.5",
                trend.direction === "up" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                trend.direction === "down" && "bg-rose-500/15 text-rose-400 border border-rose-500/30",
                trend.direction === "neutral" && "bg-[#21232c] text-[#8b8fa3] border border-[#2a2d38]"
              )}
            >
              {trend.direction === "up" && <TrendingUp className="w-3 h-3" />}
              {trend.direction === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              {trend.direction === "neutral" && <Minus className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
