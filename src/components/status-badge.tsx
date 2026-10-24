import { Badge } from "@/components/ui/badge";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "outline"> = {
  open: "outline",
  assigned: "secondary",
  in_progress: "default",
  waiting_for_client: "warning",
  resolved: "success",
  closed: "outline",
  low: "outline",
  medium: "secondary",
  high: "warning",
  urgent: "danger",
};

export function StatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  return <Badge variant={statusVariant[value] ?? "outline"}>{label}</Badge>;
}
