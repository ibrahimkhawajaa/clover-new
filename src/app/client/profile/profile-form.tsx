"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    phone: string;
    province: string;
    preferredLanguage: string;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone") || "",
          province: fd.get("province") || "",
          preferredLanguage: fd.get("preferredLanguage") || "en",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required minLength={2} defaultValue={initial.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={initial.email} disabled className="bg-surface-container" />
        <p className="text-xs text-on-surface-variant">Email cannot be changed here.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={initial.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Province / Territory</Label>
          <Input id="province" name="province" defaultValue={initial.province} placeholder="e.g. ON" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredLanguage">Preferred language</Label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={initial.preferredLanguage || "en"}
          className="flex h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
        </select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
