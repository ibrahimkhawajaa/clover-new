type Intake = {
  patient?: Record<string, string | undefined>;
  emergencyContact?: Record<string, string | undefined>;
  insurance?: Record<string, string | undefined>;
  physicians?: { primaryCare?: string; primaryPhone?: string };
  allergies?: { allergy: string; reaction: string }[];
  medications?: { medication: string; dose: string }[];
  familyHistory?: string;
  surgicalHistory?: string;
  medicalConditions?: string[];
  otherMedicalProblems?: string;
  healthConcerns?: Record<string, unknown>;
  pharmacy?: Record<string, string | undefined>;
  consent?: { signedName?: string; accurateInfo?: boolean };
};

export function IntakeViewer({ intakeJson }: { intakeJson: string | null | undefined }) {
  if (!intakeJson) {
    return <p className="text-sm text-on-surface-variant">No intake questionnaire on this ticket.</p>;
  }
  let data: Intake;
  try {
    data = JSON.parse(intakeJson) as Intake;
  } catch {
    return <p className="text-sm text-error">Intake data could not be parsed.</p>;
  }

  const hc = data.healthConcerns ?? {};

  return (
    <div className="space-y-4 text-sm">
      <Section title="Patient">
        <Row label="Name" value={`${data.patient?.firstName ?? ""} ${data.patient?.lastName ?? ""}`} />
        <Row label="DOB" value={data.patient?.dateOfBirth} />
        <Row label="Phone" value={data.patient?.mobilePhone || data.patient?.homePhone} />
        <Row label="Email" value={data.patient?.email} />
        <Row
          label="Address"
          value={[data.patient?.streetAddress, data.patient?.city, data.patient?.province, data.patient?.postalCode]
            .filter(Boolean)
            .join(", ")}
        />
      </Section>
      <Section title="Emergency contact">
        <Row label="Name" value={data.emergencyContact?.name} />
        <Row label="Relationship" value={data.emergencyContact?.relationship} />
        <Row label="Phone" value={data.emergencyContact?.mobilePhone} />
      </Section>
      <Section title="Insurance">
        <Row label="Company" value={data.insurance?.company} />
        <Row label="Group / ID" value={[data.insurance?.groupNumber, data.insurance?.idNumber].filter(Boolean).join(" / ")} />
        <Row label="Type" value={data.insurance?.type} />
      </Section>
      <Section title="Clinical">
        <Row label="PCP" value={data.physicians?.primaryCare} />
        <Row label="Allergies" value={data.allergies?.map((a) => a.allergy).join("; ")} />
        <Row label="Medications" value={data.medications?.map((m) => m.medication).join("; ")} />
        <Row label="Conditions" value={data.medicalConditions?.join(", ")} />
        <Row label="Family history" value={data.familyHistory} />
        <Row label="Surgical history" value={data.surgicalHistory} />
      </Section>
      <Section title="Health concerns">
        <Row label="Primary" value={String(hc.primaryConcern ?? "")} />
        <Row label="Began" value={String(hc.issueBegan ?? "")} />
        <Row label="Pain" value={String(hc.causesPain ?? "")} />
        <Row label="Location" value={String(hc.painLocation ?? "")} />
        <Row label="Symptoms" value={String(hc.symptoms ?? "")} />
        <Row
          label="Descriptors"
          value={Array.isArray(hc.painDescriptors) ? (hc.painDescriptors as string[]).join(", ") : ""}
        />
      </Section>
      <Section title="Pharmacy">
        <Row label="Name" value={data.pharmacy?.name} />
        <Row label="Phone" value={data.pharmacy?.phone} />
        <Row label="City" value={data.pharmacy?.city} />
      </Section>
      <Section title="Consent">
        <Row label="Signed as" value={data.consent?.signedName} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container/40 p-3">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{title}</h4>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="whitespace-pre-wrap font-medium text-on-surface">{value}</dd>
    </div>
  );
}
