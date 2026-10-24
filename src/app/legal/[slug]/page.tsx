import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicyByType } from "@/lib/legal/policies";
import type { PolicyType } from "@/db/schema";

const slugMap: Record<string, PolicyType> = {
  terms: "terms",
  privacy: "privacy",
  "acceptable-use": "acceptable_use",
  disclaimer: "disclaimer",
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const type = slugMap[slug];
  if (!type) notFound();
  const policy = getPolicyByType(type);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-secondary underline">
        ← Home
      </Link>
      <article className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-8 shadow-sm">
        {policy.contentMarkdown}
      </article>
      <p className="mt-4 text-xs text-on-surface-variant">Version {policy.version}</p>
    </div>
  );
}
