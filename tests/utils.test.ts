import { describe, expect, it } from "vitest";
import { elapsedSecondsSince, formatDuration, dashboardPathForRole } from "@/lib/utils";

describe("utils", () => {
  it("formats duration as HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(65)).toBe("00:01:05");
    expect(formatDuration(3661)).toBe("01:01:01");
  });

  it("computes elapsed seconds from server timestamps", () => {
    const start = "2026-01-01 00:00:00";
    const end = "2026-01-01 00:01:30";
    expect(elapsedSecondsSince(start, end)).toBe(90);
  });

  it("maps roles to dashboards", () => {
    expect(dashboardPathForRole("admin")).toBe("/admin");
    expect(dashboardPathForRole("client")).toBe("/client");
    expect(dashboardPathForRole("assistant")).toBe("/assistant");
  });
});
