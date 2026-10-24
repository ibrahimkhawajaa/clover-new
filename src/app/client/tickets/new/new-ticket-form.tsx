"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEDICAL_CONDITIONS, PAIN_DESCRIPTORS } from "@/lib/intake";
import { ticketPriorities } from "@/db/schema";

type Category = { id: string; name: string };

const STEPS = [
  "Ticket",
  "Patient",
  "Contacts & insurance",
  "Clinical history",
  "Health concerns",
  "Consent",
] as const;

export function NewTicketForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [descriptors, setDescriptors] = useState<string[]>([]);

  const [ticket, setTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });
  const [patient, setPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "prefer_not" as string,
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    homePhone: "",
    mobilePhone: "",
    email: "",
    primaryLanguage: "English",
    maritalStatus: "",
  });
  const [emergency, setEmergency] = useState({
    name: "",
    relationship: "",
    mobilePhone: "",
  });
  const [insurance, setInsurance] = useState({
    company: "",
    groupNumber: "",
    idNumber: "",
    type: "" as string,
  });
  const [clinical, setClinical] = useState({
    primaryCare: "",
    primaryPhone: "",
    allergies: "",
    medications: "",
    familyHistory: "",
    surgicalHistory: "",
    otherMedicalProblems: "",
  });
  const [concerns, setConcerns] = useState({
    primaryConcern: "",
    issueBegan: "",
    causesPain: "" as string,
    painLocation: "",
    painChange: "" as string,
    painOnset: "" as string,
    painFrequency: "" as string,
    symptoms: "",
    otherConcerns: "",
  });
  const [pharmacy, setPharmacy] = useState({ name: "", phone: "", city: "" });
  const [consent, setConsent] = useState({
    accurateInfo: false,
    privacyAck: false,
    treatmentConsent: false,
    communicationConsent: false,
    signedName: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.items ?? []))
      .catch(() => toast.error("Could not load categories"));
  }, []);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function next() {
    if (step === 0) {
      if (ticket.title.trim().length < 3 || ticket.description.trim().length < 10 || !ticket.category) {
        toast.error("Complete ticket title, category, and description");
        return;
      }
    }
    if (step === 1) {
      if (!patient.firstName.trim() || !patient.lastName.trim()) {
        toast.error("First and last name are required");
        return;
      }
    }
    if (step === 4) {
      if (concerns.primaryConcern.trim().length < 3) {
        toast.error("Primary health concern is required");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    if (!consent.accurateInfo || !consent.privacyAck || !consent.treatmentConsent) {
      toast.error("Required consents must be accepted");
      return;
    }
    if (consent.signedName.trim().length < 2) {
      toast.error("Please type your full name to sign");
      return;
    }
    setSubmitting(true);
    try {
      const intake = {
        patient: {
          ...patient,
          gender: patient.gender as "male" | "female" | "other" | "prefer_not",
        },
        emergencyContact: emergency,
        insurance: { ...insurance, type: (insurance.type || "") as "hmo" | "ppo" | "medicare" | "other" | "" },
        physicians: {
          primaryCare: clinical.primaryCare,
          primaryPhone: clinical.primaryPhone,
        },
        allergies: clinical.allergies
          ? [{ allergy: clinical.allergies, reaction: "" }]
          : [],
        medications: clinical.medications
          ? [{ medication: clinical.medications, dose: "" }]
          : [],
        familyHistory: clinical.familyHistory,
        surgicalHistory: clinical.surgicalHistory,
        medicalConditions: conditions,
        otherMedicalProblems: clinical.otherMedicalProblems,
        healthConcerns: {
          primaryConcern: concerns.primaryConcern,
          issueBegan: concerns.issueBegan,
          causesPain: (concerns.causesPain || "") as "yes" | "no" | "",
          painLocation: concerns.painLocation,
          painChange: (concerns.painChange || "") as "increased" | "decreased" | "unchanged" | "",
          painOnset: (concerns.painOnset || "") as "gradually" | "suddenly" | "",
          painFrequency: (concerns.painFrequency || "") as
            | "constantly"
            | "occasionally"
            | "rarely"
            | "",
          symptoms: concerns.symptoms,
          painDescriptors: descriptors,
          otherConcerns: concerns.otherConcerns,
        },
        pharmacy,
        consent: {
          accurateInfo: true as const,
          privacyAck: true as const,
          treatmentConsent: true as const,
          communicationConsent: consent.communicationConsent,
          signedName: consent.signedName,
        },
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          intake,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create ticket");
      toast.success(`Ticket ${data.ticketNumber} created`);
      router.push(`/client/tickets/${data.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  const field = "flex h-10 w-full rounded-xl border border-outline-variant bg-white px-3 text-sm";
  const section = "space-y-3 rounded-2xl border border-outline-variant/50 bg-white p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i === step
                ? "bg-primary text-on-primary"
                : i < step
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className={section}>
          <p className="text-sm text-on-surface-variant">
            Start with your support request. Clinical intake follows (SIN/SSN are not collected online).
          </p>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              className="rounded-xl"
              value={ticket.title}
              onChange={(e) => setTicket({ ...ticket, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className={field}
              value={ticket.category}
              onChange={(e) => setTicket({ ...ticket, category: e.target.value })}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <select
              className={field}
              value={ticket.priority}
              onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
            >
              {ticketPriorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="min-h-28 w-full rounded-xl border border-outline-variant bg-white p-3 text-sm"
              value={ticket.description}
              onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={section}>
          <h3 className="font-semibold text-primary">Patient details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>First name *</Label>
              <Input
                value={patient.firstName}
                onChange={(e) => setPatient({ ...patient, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Last name *</Label>
              <Input
                value={patient.lastName}
                onChange={(e) => setPatient({ ...patient, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={patient.dateOfBirth}
                onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <select
                className={field}
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
              >
                <option value="prefer_not">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Street address</Label>
              <Input
                value={patient.streetAddress}
                onChange={(e) => setPatient({ ...patient, streetAddress: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input
                value={patient.city}
                onChange={(e) => setPatient({ ...patient, city: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Province / Territory</Label>
              <Input
                value={patient.province}
                onChange={(e) => setPatient({ ...patient, province: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Postal code</Label>
              <Input
                value={patient.postalCode}
                onChange={(e) => setPatient({ ...patient, postalCode: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Mobile phone</Label>
              <Input
                value={patient.mobilePhone}
                onChange={(e) => setPatient({ ...patient, mobilePhone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={patient.email}
                onChange={(e) => setPatient({ ...patient, email: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className={section}>
            <h3 className="font-semibold text-primary">Emergency contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Name"
                value={emergency.name}
                onChange={(e) => setEmergency({ ...emergency, name: e.target.value })}
              />
              <Input
                placeholder="Relationship"
                value={emergency.relationship}
                onChange={(e) => setEmergency({ ...emergency, relationship: e.target.value })}
              />
              <Input
                placeholder="Mobile"
                value={emergency.mobilePhone}
                onChange={(e) => setEmergency({ ...emergency, mobilePhone: e.target.value })}
              />
            </div>
          </div>
          <div className={section}>
            <h3 className="font-semibold text-primary">Primary insurance</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Company"
                value={insurance.company}
                onChange={(e) => setInsurance({ ...insurance, company: e.target.value })}
              />
              <Input
                placeholder="Group #"
                value={insurance.groupNumber}
                onChange={(e) => setInsurance({ ...insurance, groupNumber: e.target.value })}
              />
              <Input
                placeholder="ID #"
                value={insurance.idNumber}
                onChange={(e) => setInsurance({ ...insurance, idNumber: e.target.value })}
              />
              <select
                className={field}
                value={insurance.type}
                onChange={(e) => setInsurance({ ...insurance, type: e.target.value })}
              >
                <option value="">Type…</option>
                <option value="hmo">HMO</option>
                <option value="ppo">PPO</option>
                <option value="medicare">Medicare</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className={section}>
            <h3 className="font-semibold text-primary">Preferred pharmacy</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Name"
                value={pharmacy.name}
                onChange={(e) => setPharmacy({ ...pharmacy, name: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={pharmacy.phone}
                onChange={(e) => setPharmacy({ ...pharmacy, phone: e.target.value })}
              />
              <Input
                placeholder="City"
                value={pharmacy.city}
                onChange={(e) => setPharmacy({ ...pharmacy, city: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className={section}>
            <h3 className="font-semibold text-primary">Physicians & history</h3>
            <Input
              placeholder="Primary care physician"
              value={clinical.primaryCare}
              onChange={(e) => setClinical({ ...clinical, primaryCare: e.target.value })}
            />
            <Input
              placeholder="Physician phone"
              value={clinical.primaryPhone}
              onChange={(e) => setClinical({ ...clinical, primaryPhone: e.target.value })}
            />
            <textarea
              className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
              placeholder="Allergies and reactions"
              value={clinical.allergies}
              onChange={(e) => setClinical({ ...clinical, allergies: e.target.value })}
            />
            <textarea
              className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
              placeholder="Current medications and doses"
              value={clinical.medications}
              onChange={(e) => setClinical({ ...clinical, medications: e.target.value })}
            />
            <textarea
              className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
              placeholder="Family health history"
              value={clinical.familyHistory}
              onChange={(e) => setClinical({ ...clinical, familyHistory: e.target.value })}
            />
            <textarea
              className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
              placeholder="Surgical history / hospitalizations"
              value={clinical.surgicalHistory}
              onChange={(e) => setClinical({ ...clinical, surgicalHistory: e.target.value })}
            />
          </div>
          <div className={section}>
            <h3 className="mb-2 font-semibold text-primary">Medical conditions (check all that apply)</h3>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {MEDICAL_CONDITIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={conditions.includes(c)}
                    onChange={() => toggle(conditions, c, setConditions)}
                  />
                  {c}
                </label>
              ))}
            </div>
            <textarea
              className="mt-3 min-h-16 w-full rounded-xl border border-outline-variant p-3 text-sm"
              placeholder="Other medical problems"
              value={clinical.otherMedicalProblems}
              onChange={(e) =>
                setClinical({ ...clinical, otherMedicalProblems: e.target.value })
              }
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={section}>
          <h3 className="font-semibold text-primary">Health concerns</h3>
          <div className="space-y-2">
            <Label>Primary health concern *</Label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-outline-variant p-3 text-sm"
              value={concerns.primaryConcern}
              onChange={(e) => setConcerns({ ...concerns, primaryConcern: e.target.value })}
            />
          </div>
          <Input
            placeholder="When did this issue begin?"
            value={concerns.issueBegan}
            onChange={(e) => setConcerns({ ...concerns, issueBegan: e.target.value })}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Causes pain?</span>
            {["yes", "no"].map((v) => (
              <label key={v} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="pain"
                  checked={concerns.causesPain === v}
                  onChange={() => setConcerns({ ...concerns, causesPain: v })}
                />
                {v}
              </label>
            ))}
          </div>
          {concerns.causesPain === "yes" && (
            <>
              <Input
                placeholder="Where is the pain?"
                value={concerns.painLocation}
                onChange={(e) => setConcerns({ ...concerns, painLocation: e.target.value })}
              />
              <select
                className={field}
                value={concerns.painChange}
                onChange={(e) => setConcerns({ ...concerns, painChange: e.target.value })}
              >
                <option value="">Pain change…</option>
                <option value="increased">Increased</option>
                <option value="decreased">Decreased</option>
                <option value="unchanged">Unchanged</option>
              </select>
              <select
                className={field}
                value={concerns.painOnset}
                onChange={(e) => setConcerns({ ...concerns, painOnset: e.target.value })}
              >
                <option value="">Onset…</option>
                <option value="gradually">Gradually</option>
                <option value="suddenly">Suddenly</option>
              </select>
              <select
                className={field}
                value={concerns.painFrequency}
                onChange={(e) => setConcerns({ ...concerns, painFrequency: e.target.value })}
              >
                <option value="">Frequency…</option>
                <option value="constantly">Constantly</option>
                <option value="occasionally">Occasionally</option>
                <option value="rarely">Rarely</option>
              </select>
              <div>
                <p className="mb-2 text-sm font-medium">Pain descriptors</p>
                <div className="flex flex-wrap gap-2">
                  {PAIN_DESCRIPTORS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggle(descriptors, d, setDescriptors)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        descriptors.includes(d)
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <textarea
            className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
            placeholder="Current symptoms"
            value={concerns.symptoms}
            onChange={(e) => setConcerns({ ...concerns, symptoms: e.target.value })}
          />
          <textarea
            className="min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
            placeholder="Other health concerns"
            value={concerns.otherConcerns}
            onChange={(e) => setConcerns({ ...concerns, otherConcerns: e.target.value })}
          />
        </div>
      )}

      {step === 5 && (
        <div className={section}>
          <h3 className="font-semibold text-primary">Patient consent</h3>
          <p className="text-sm text-on-surface-variant">
            By checking below you certify the information is accurate, acknowledge privacy practices,
            and consent to support coordination (not emergency care). This is not a substitute for
            in-person clinical consent where required by law.
          </p>
          {(
            [
              ["accurateInfo", "I certify this information is accurate and complete"],
              ["privacyAck", "I acknowledge the Privacy Policy and data practices"],
              ["treatmentConsent", "I consent to support coordination via this portal"],
              ["communicationConsent", "I consent to appointment/support reminders by email/phone"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent[key]}
                onChange={(e) => setConsent({ ...consent, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
          <div className="space-y-1">
            <Label>Type full name to sign *</Label>
            <Input
              value={consent.signedName}
              onChange={(e) => setConsent({ ...consent, signedName: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Submitting…" : "Create ticket"}
          </Button>
        )}
      </div>
    </div>
  );
}
