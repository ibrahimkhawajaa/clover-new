import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { requirePageUser } from "@/lib/auth/guards";
import { AddCategoryForm } from "./add-category-form";

export default async function AdminSettingsPage() {
  await requirePageUser(["admin"]);

  const categories = await db.query.supportCategories.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Manage support ticket categories available to clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add category</CardTitle>
          <CardDescription>New categories appear in the client ticket form when active.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddCategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>{categories.length} configured</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-outline-variant/50 bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-on-surface-variant">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container/60"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {c.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">{c.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
