"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeactivateButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deactivate() {
    if (!confirm("Deactivate this account? Active sessions will be signed out.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: "deactivated" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deactivation failed");
      toast.success("User deactivated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deactivation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={disabled || loading}
      onClick={deactivate}
    >
      {loading ? "…" : "Deactivate"}
    </Button>
  );
}
