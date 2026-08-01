import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
        outline:
          "border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90",
        ghost:
          "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90",
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 rounded-md px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-sm",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-xs": "h-7 w-7 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };