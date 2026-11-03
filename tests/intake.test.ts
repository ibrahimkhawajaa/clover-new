import { describe, expect, it } from "vitest";
import { assistantTicketView, type TicketRow } from "@/lib/authz/tickets";
import { parseAssistantIntake } from "@/lib/intake";

describe("assistant intake visibility", () => {
  it("keeps only the patient's name and health concerns", () => {
    const intake = parseAssistantIntake(
      JSON.stringify({
        patient: {
          firstName: "Taylor",
          lastName: "Morgan",
          email: "taylor@example.test",
          mobilePhone: "555-0100",
        },
        insurance: { company: "Private Plan", idNumber: "12345" },
        emergencyContact: { name: "Jordan Morgan" },
        healthConcerns: { primaryConcern: "Recurring headaches" },
      })
    );

    expect(intake).toEqual({
      patient: { firstName: "Taylor", lastName: "Morgan" },
      healthConcerns: { primaryConcern: "Recurring headaches" },
    });
  });

  it("omits free-form job details from assistant ticket responses", () => {
    const ticket = {
      id: "ticket-1",
      ticketNumber: "CLO-1001",
      clientId: "client-1",
      assignedAssistantId: "assistant-1",
      title: "Contact details in title",
      description: "Insurance information in description",
      category: "General",
      priority: "medium",
      status: "assigned",
      intakeJson: JSON.stringify({
        patient: { firstName: "Taylor", lastName: "Morgan", email: "private@example.test" },
        insurance: { company: "Private Plan" },
        healthConcerns: { primaryConcern: "Recurring headaches" },
      }),
      createdAt: "2026-01-01 00:00:00",
      updatedAt: "2026-01-01 00:00:00",
      assignedAt: "2026-01-01 00:00:00",
      resolvedAt: null,
      closedAt: null,
    } satisfies TicketRow;

    expect(assistantTicketView(ticket)).toEqual({
      id: "ticket-1",
      ticketNumber: "CLO-1001",
      priority: "medium",
      status: "assigned",
      createdAt: "2026-01-01 00:00:00",
      patient: { firstName: "Taylor", lastName: "Morgan" },
      healthConcerns: { primaryConcern: "Recurring headaches" },
    });
  });
});
