"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Assistant = {
  id: string;
  name: string;
  email: string;
  accountStatus?: string;
};

export function AssignForm({
  ticketId,
  currentAssistantId,
}: {
  ticketId: string;
  currentAssistantId: string | null;
}) {
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users?role=assistant&pageSize=50");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load assistants");
        if (!cancelled) {
          setAssistants(
            (data.items as Assistant[]).filter((u) => u.accountStatus !== "deactivated")
          );
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load assistants");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId: fd.get("assistantId"),
          reason: fd.get("reason") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Assignment failed");
      toast.success(currentAssistantId ? "Ticket reassigned" : "Ticket assigned");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="assistantId">Assistant</Label>
        <select
          id="assistantId"
          name="assistantId"
          required
          disabled={loading}
          defaultValue={currentAssistantId ?? ""}
          className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          <option value="" disabled>
            {loading ? "Loading…" : "Select assistant"}
          </option>
          {assistants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.email})
            </option>
          ))}
        </select>
      </div>
      {currentAssistantId && (
        <div className="space-y-2">
          <Label htmlFor="reason">Reassignment reason</Label>
          <Input id="reason" name="reason" placeholder="Optional reason" maxLength={500} />
        </div>
      )}
      <Button type="submit" disabled={submitting || loading}>
        {submitting ? "Saving…" : currentAssistantId ? "Reassign" : "Assign"}
      </Button>
    </form>
  );
}
