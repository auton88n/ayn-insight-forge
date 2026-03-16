import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-[20px] text-card-foreground transition-all duration-300",
      // Glass styling in dark mode
      "dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
      "dark:border-t dark:border-l dark:border-t-[rgba(255,255,255,0.18)] dark:border-l-[rgba(255,255,255,0.12)]",
      "dark:border-r dark:border-b dark:border-r-transparent dark:border-b-transparent",
      "dark:shadow-[0_0_0_0.5px_rgba(0,0,0,0.3),0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
      // Light mode
      "bg-card shadow-lg border-0",
      // Hover — Apple spring
      "dark:hover:bg-[rgba(255,255,255,0.09)] dark:hover:backdrop-blur-[60px] dark:hover:border-t-[rgba(255,255,255,0.2)] dark:hover:scale-[1.01]",
      "hover:shadow-2xl",
      // Glass noise texture
      "dark:glass-noise",
      className
    )}
    style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 relative z-[2]", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-relaxed tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 relative z-[2]", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 relative z-[2]", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
