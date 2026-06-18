import { cn } from "@/lib/utils";
import { LucideIcon, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ============ STAT CARD ============
interface StatCardProps {
  valueClassName?: string;
  title: string;
  value: string | number;
  tooltip?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  trendPosition?: "value" | "title";
  loading?: boolean;
  className?: string;
  variant?: "blue" | "amber" | "emerald" | "gray" | "primary" | "orange" | "red";
  onIconClick?: () => void;
  iconAction?: {
    label: string;
    onClick: () => void;
  };
}

const statCardVariants = {
  blue: {
    borderColor: "border-t-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  amber: {
    borderColor: "border-t-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  emerald: {
    borderColor: "border-t-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  gray: {
    borderColor: "border-t-gray-400 dark:border-t-gray-500",
    iconBg: "bg-gray-100 dark:bg-gray-500/15",
    iconColor: "text-gray-500 dark:text-gray-400",
    dotColor: "bg-gray-400",
  },
  primary: {
    borderColor: "border-t-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    dotColor: "bg-primary",
  },
  orange: {
    borderColor: "border-t-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-500/15",
    iconColor: "text-orange-600 dark:text-orange-400",
    dotColor: "bg-orange-500",
  },
  red: {
    borderColor: "border-t-red-500",
    iconBg: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-500 dark:text-red-400",
    dotColor: "bg-red-500",
  },
};

function TrendBadge({ trend }: { trend: { value: number; isPositive: boolean; label?: string } }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [showTooltip]);

  const isNeutral = trend.value === 0;
  const tooltipText = isNeutral
    ? `Sem variação ${trend.label || 'vs período anterior'}`
    : trend.label
      ? `${trend.isPositive ? "+" : "-"}${Math.abs(trend.value)}% ${trend.label}`
      : `${trend.isPositive ? "+" : "-"}${Math.abs(trend.value)}% vs período anterior`;

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((v) => !v)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-semibold cursor-default select-none",
          isNeutral
            ? "text-muted-foreground"
            : trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
        )}
      >
        <span className="text-[11px]">{isNeutral ? "—" : trend.isPositive ? "↑" : "↓"}</span>
        <span>{isNeutral ? "0%" : `${Math.abs(trend.value)}%`}</span>
      </span>
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
            {tooltipText}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export function StatCard({ title, value, tooltip, icon: Icon, trend, trendPosition = "value", loading, className, variant = "primary", onIconClick, iconAction, valueClassName }: StatCardProps) {
  const colors = statCardVariants[variant];
  const [animate, setAnimate] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 350);
      return () => clearTimeout(timer);
    }
  }, [value]);

  if (loading) {
    return (
      <div className={cn(
        "bg-card rounded-xl overflow-hidden border border-border/50 border-t-4",
        colors.borderColor,
        className
      )}>
        <div className="px-5 py-5 flex items-start justify-between">
          <div className="space-y-2.5 flex-1">
            <div className="skeleton h-3.5 w-28 rounded-md" />
            <div className="skeleton h-8 w-20 rounded-md" />
          </div>
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border/50 border-t-4 transition-transform duration-200 hover:shadow-md hover:-translate-y-0.5",
        colors.borderColor,
        className
      )}
    >
      <div className="px-5 py-3.5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase truncate">
              {title}
            </p>
            {tooltip && (
              <div
                className="relative"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors" />
                {showInfoTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900" />
                      {tooltip}
                    </div>
                  </div>
                )}
              </div>
            )}
            {trend && trendPosition === "title" && <TrendBadge trend={trend} />}
          </div>
          <div
            className={cn(
              "flex items-center gap-2 mt-0.5 transition-colors duration-300 ease-out",
              animate ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
            )}
          >

            <span className={cn("text-2xl font-bold tracking-tight", valueClassName)}>{value}</span>
            {trend && trendPosition === "value" && <TrendBadge trend={trend} />}
          </div>

        </div>
        {onIconClick ? (
          <button
            onClick={onIconClick}
            className="shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110 p-1"
          >
            <Icon className={cn("h-5 w-5", colors.iconColor)} />
          </button>
        ) : iconAction ? (
          <button
            onClick={iconAction.onClick}
            className={cn(
              "flex items-center gap-1.5 rounded-lg shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-sm",
              colors.iconBg
            )}
            style={{ padding: "10px" }}
          >
            <Icon className={cn("h-5 w-5", colors.iconColor)} />
            <span className={cn("text-xs font-semibold", colors.iconColor)}>{iconAction.label}</span>
          </button>
        ) : (
          <div className={cn("p-2.5 rounded-lg shrink-0", colors.iconBg)}>
            <Icon className={cn("h-5 w-5", colors.iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============ STATUS BADGE ============
type BadgeVariant = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/30",
  warning: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/30",
  error: "bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400 border-red-200/50 dark:border-red-500/30",
  info: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/30",
  default: "bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-500/30",
};

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold border tracking-wide",
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}

// ============ EMPTY STATE ============
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-7 text-center",
      className
    )}>
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2.5">{title}</h3>
      {description && (
        <p className="text-base text-muted-foreground max-w-sm mb-7 leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary/90 transition-[colors,box-shadow] duration-200 shadow-sm hover:shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============ PAGE HEADER ============
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, actions, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">{icon}{title}</h1>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============ DATA TABLE SKELETON ============
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="skeleton h-7 w-60 rounded-lg" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-5 p-6">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="skeleton h-5 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SECTION CARD ============
interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  icon?: React.ReactNode;
  iconBg?: string;
}

export function SectionCard({ title, description, children, actions, headerRight, className, noPadding, icon, iconBg }: SectionCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border/50", className)}>
      {(title || actions || headerRight) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg || "bg-muted")} style={{borderRadius: '12px'}}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            {actions}
          </div>
        </div>
      )}
      <div className={noPadding ? "" : "px-5 pb-5"}>
        {children}
      </div>
    </div>
  );
}

// ============ ACTION MENU ============
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated border-border/50">
        {items.map((item, index) => (
          <div key={index}>
            {item.separator && index > 0 && <DropdownMenuSeparator className="bg-border/50" />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(
                "cursor-pointer rounded-lg mx-1.5 my-1",
                item.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5 mr-3" />}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
