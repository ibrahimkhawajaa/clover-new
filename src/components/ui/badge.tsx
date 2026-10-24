import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary-fixed text-on-primary-fixed",
        secondary: "bg-secondary-container text-on-secondary-container",
        outline: "border border-outline-variant text-on-surface-variant",
        success: "bg-secondary-fixed text-on-secondary-fixed",
        warning: "bg-tertiary-fixed text-on-tertiary-fixed",
        danger: "bg-error-container text-on-error-container",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
