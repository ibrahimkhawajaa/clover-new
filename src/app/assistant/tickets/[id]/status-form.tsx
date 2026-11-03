"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ASSISTANT_STATUSES = ["in_progress", "waiting_for_client", "resolved"] as const;

export function AssistantStatusForm({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const defaultStatus = ASSISTANT_STATUSES.includes(
    currentStatus as (typeof ASSISTANT_STATUSES)[number]
  )
    ? currentStatus
    : "in_progress";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: fd.get("status") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update status");
      toast.success("Status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={onSubmit}>
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="status">Update status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus}
          className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          {ASSISTANT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
