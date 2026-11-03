"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ticketPriorities, ticketStatuses } from "@/db/schema";

export function TicketControls({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);

  async function patch(body: Record<string, string>) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    return data;
  }

  async function onStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingStatus(true);
    const fd = new FormData(e.currentTarget);
    try {
      await patch({ status: String(fd.get("status")) });
      toast.success("Status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingStatus(false);
    }
  }

  async function onPriority(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPriority(true);
    const fd = new FormData(e.currentTarget);
    try {
      await patch({ priority: String(fd.get("priority")) });
      toast.success("Priority updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingPriority(false);
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <form className="space-y-3" onSubmit={onStatus}>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          {ticketStatuses.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={savingStatus}>
          {savingStatus ? "Saving…" : "Update status"}
        </Button>
      </form>

      <form className="space-y-3" onSubmit={onPriority}>
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          defaultValue={priority}
          className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          {ticketPriorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="secondary" disabled={savingPriority}>
          {savingPriority ? "Saving…" : "Update priority"}
        </Button>
      </form>
    </div>
  );
}
