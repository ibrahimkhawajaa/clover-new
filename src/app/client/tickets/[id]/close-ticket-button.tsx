"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CloseTicketButton({
  ticketId,
  disabled,
}: {
  ticketId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function closeTicket() {
    if (!confirm("Close this ticket? You can still view it afterward.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not close ticket");
      toast.success("Ticket closed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || loading}
      onClick={closeTicket}
    >
      {loading ? "Closing…" : "Close ticket"}
    </Button>
  );
}
