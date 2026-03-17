import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

/* ─── GlassCard ─── */
const glassCardVariants = cva(
  "relative backdrop-blur-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--glass-bg))] border-[hsl(var(--glass-border))] shadow-[var(--glass-shadow)]",
        elevated:
          "bg-[hsl(var(--glass-bg-elevated))] border-[hsl(var(--glass-border-strong))] shadow-[var(--glass-shadow-elevated)]",
        subtle:
          "bg-[hsl(var(--glass-bg-subtle))] border-[hsl(var(--glass-border-subtle))] shadow-sm",
        colorful:
          "bg-[hsl(var(--glass-bg))] border-[hsl(var(--glass-border))] shadow-[var(--glass-shadow)]",
      },
      size: {
        sm: "rounded-2xl p-4",
        default: "rounded-3xl p-6",
        lg: "rounded-[2rem] p-8",
      },
      hover: {
        none: "",
        lift: "hover:scale-[1.02] hover:shadow-[var(--glass-shadow-elevated)] hover:border-[hsl(var(--glass-border-strong))]",
        glow: "hover:shadow-[var(--glass-glow)] hover:border-[hsl(var(--glass-border-strong))]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "lift",
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  /** Optional colored glow accent: purple | blue | orange | emerald | amber */
  glow?: "purple" | "blue" | "orange" | "emerald" | "amber";
}

const glowMap: Record<string, string> = {
  purple: "before:bg-[radial-gradient(ellipse_at_center,hsl(270_70%_60%/0.15),transparent_70%)]",
  blue: "before:bg-[radial-gradient(ellipse_at_center,hsl(210_90%_60%/0.15),transparent_70%)]",
  orange: "before:bg-[radial-gradient(ellipse_at_center,hsl(25_95%_55%/0.15),transparent_70%)]",
  emerald: "before:bg-[radial-gradient(ellipse_at_center,hsl(160_60%_45%/0.15),transparent_70%)]",
  amber: "before:bg-[radial-gradient(ellipse_at_center,hsl(40_95%_55%/0.15),transparent_70%)]",
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, size, hover, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        glassCardVariants({ variant, size, hover }),
        glow && "before:absolute before:inset-0 before:rounded-[inherit] before:pointer-events-none before:-z-10 before:blur-2xl before:scale-110",
        glow && glowMap[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassCard.displayName = "GlassCard";

/* ─── GlassButton ─── */
const glassButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 backdrop-blur-lg border relative overflow-hidden active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(0_0%_100%/0.12)] border-[hsl(0_0%_100%/0.2)] text-foreground hover:bg-[hsl(0_0%_100%/0.2)] hover:shadow-[0_0_20px_hsl(0_0%_100%/0.1)]",
        primary:
          "bg-gradient-to-r from-[hsl(270_70%_55%)] to-[hsl(210_90%_55%)] border-[hsl(0_0%_100%/0.25)] text-white hover:shadow-[0_0_30px_hsl(270_70%_55%/0.4)] hover:brightness-110",
        accent:
          "bg-gradient-to-r from-[hsl(25_95%_55%)] to-[hsl(340_80%_55%)] border-[hsl(0_0%_100%/0.25)] text-white hover:shadow-[0_0_30px_hsl(25_95%_55%/0.4)] hover:brightness-110",
        ghost:
          "bg-transparent border-transparent text-foreground hover:bg-[hsl(0_0%_100%/0.08)]",
        outline:
          "bg-transparent border-[hsl(0_0%_100%/0.2)] text-foreground hover:bg-[hsl(0_0%_100%/0.08)] hover:border-[hsl(0_0%_100%/0.3)]",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-xl",
        default: "h-11 px-6 text-sm rounded-2xl",
        lg: "h-13 px-8 text-base rounded-2xl",
        xl: "h-14 px-10 text-lg rounded-full",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref as any}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";

/* ─── GlassContainer ─── */
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show animated gradient blobs behind content */
  withBlobs?: boolean;
  /** Gradient direction */
  gradient?: "default" | "warm" | "cool" | "aurora";
}

const gradientClasses: Record<string, string> = {
  default: "from-[hsl(270_50%_15%)] via-[hsl(220_60%_12%)] to-[hsl(0_0%_4%)]",
  warm: "from-[hsl(270_50%_15%)] via-[hsl(340_50%_12%)] to-[hsl(25_60%_10%)]",
  cool: "from-[hsl(220_60%_12%)] via-[hsl(200_50%_10%)] to-[hsl(260_40%_8%)]",
  aurora: "from-[hsl(270_60%_18%)] via-[hsl(200_70%_15%)] to-[hsl(160_50%_10%)]",
};

const GlassContainer = React.forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className, withBlobs = true, gradient = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative min-h-screen overflow-hidden bg-gradient-to-br",
        gradientClasses[gradient],
        className
      )}
      {...props}
    >
      {/* Animated gradient blobs */}
      {withBlobs && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="glass-blob glass-blob-1" />
          <div className="glass-blob glass-blob-2" />
          <div className="glass-blob glass-blob-3" />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        </div>
      )}
      {children}
    </div>
  )
);
GlassContainer.displayName = "GlassContainer";

/* ─── GlassInput ─── */
const GlassInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border bg-[hsl(0_0%_100%/0.08)] border-[hsl(0_0%_100%/0.15)] px-4 py-2 text-sm text-foreground backdrop-blur-sm",
        "placeholder:text-[hsl(0_0%_100%/0.4)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270_70%_55%/0.5)] focus-visible:border-[hsl(0_0%_100%/0.3)]",
        "transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
GlassInput.displayName = "GlassInput";

/* ─── GlassBadge ─── */
interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "purple" | "blue" | "orange" | "emerald" | "amber";
}

const badgeColors: Record<string, string> = {
  default: "bg-[hsl(0_0%_100%/0.12)] border-[hsl(0_0%_100%/0.2)] text-foreground",
  purple: "bg-[hsl(270_70%_55%/0.2)] border-[hsl(270_70%_55%/0.3)] text-[hsl(270_70%_80%)]",
  blue: "bg-[hsl(210_90%_55%/0.2)] border-[hsl(210_90%_55%/0.3)] text-[hsl(210_90%_80%)]",
  orange: "bg-[hsl(25_95%_55%/0.2)] border-[hsl(25_95%_55%/0.3)] text-[hsl(25_95%_80%)]",
  emerald: "bg-[hsl(160_60%_45%/0.2)] border-[hsl(160_60%_45%/0.3)] text-[hsl(160_60%_75%)]",
  amber: "bg-[hsl(40_95%_55%/0.2)] border-[hsl(40_95%_55%/0.3)] text-[hsl(40_95%_80%)]",
};

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border backdrop-blur-sm px-3 py-1 text-xs font-medium",
        badgeColors[variant],
        className
      )}
      {...props}
    />
  )
);
GlassBadge.displayName = "GlassBadge";

export {
  GlassCard,
  glassCardVariants,
  GlassButton,
  glassButtonVariants,
  GlassContainer,
  GlassInput,
  GlassBadge,
};
