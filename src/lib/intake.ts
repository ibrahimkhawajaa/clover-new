import { z } from "zod";

/** Patient intake based on Clover clinical forms. SIN/SSN intentionally omitted. */
export const intakeSchema = z.object({
  patient: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    dateOfBirth: z.string().max(40).optional(),
    gender: z.enum(["male", "female", "other", "prefer_not"]).optional(),
    streetAddress: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    province: z.string().max(40).optional(),
    postalCode: z.string().max(20).optional(),
    homePhone: z.string().max(30).optional(),
    mobilePhone: z.string().max(30).optional(),
    email: z.string().email().optional().or(z.literal("")),
    ethnicity: z.string().max(80).optional(),
    weight: z.string().max(20).optional(),
    height: z.string().max(20).optional(),
    primaryLanguage: z.string().max(40).optional(),
    maritalStatus: z.string().max(40).optional(),
    spouseName: z.string().max(80).optional(),
    spousePhone: z.string().max(30).optional(),
  }),
  emergencyContact: z
    .object({
      name: z.string().max(80).optional(),
      relationship: z.string().max(60).optional(),
      email: z.string().max(120).optional(),
      homePhone: z.string().max(30).optional(),
      mobilePhone: z.string().max(30).optional(),
    })
    .optional(),
  insurance: z
    .object({
      company: z.string().max(120).optional(),
      groupNumber: z.string().max(60).optional(),
      idNumber: z.string().max(60).optional(),
      type: z.enum(["hmo", "ppo", "medicare", "other", ""]).optional(),
      otherType: z.string().max(60).optional(),
    })
    .optional(),
  physicians: z
    .object({
      primaryCare: z.string().max(120).optional(),
      primaryPhone: z.string().max(30).optional(),
      others: z
        .array(z.object({ name: z.string().max(120), specialty: z.string().max(80) }))
        .max(4)
        .optional(),
    })
    .optional(),
  allergies: z
    .array(z.object({ allergy: z.string().max(120), reaction: z.string().max(200) }))
    .max(8)
    .optional(),
  medications: z
    .array(z.object({ medication: z.string().max(120), dose: z.string().max(80) }))
    .max(12)
    .optional(),
  familyHistory: z.string().max(2000).optional(),
  surgicalHistory: z.string().max(2000).optional(),
  medicalConditions: z.array(z.string()).max(80).optional(),
  otherMedicalProblems: z.string().max(2000).optional(),
  healthConcerns: z.object({
    primaryConcern: z.string().min(3).max(2000),
    issueBegan: z.string().max(200).optional(),
    causesPain: z.enum(["yes", "no", ""]).optional(),
    painLocation: z.string().max(200).optional(),
    painChange: z.enum(["increased", "decreased", "unchanged", ""]).optional(),
    painOnset: z.enum(["gradually", "suddenly", ""]).optional(),
    painFrequency: z.enum(["constantly", "occasionally", "rarely", ""]).optional(),
    painWorst: z.array(z.string()).max(4).optional(),
    symptoms: z.string().max(1000).optional(),
    painDescriptors: z.array(z.string()).max(20).optional(),
    otherConcerns: z.string().max(2000).optional(),
  }),
  socialHistory: z
    .object({
      alcohol: z.enum(["yes", "no", ""]).optional(),
      drinksPerWeek: z.string().max(20).optional(),
      smoking: z.enum(["yes", "no", ""]).optional(),
      smokeType: z.string().max(80).optional(),
      cigarettesPerDay: z.string().max(20).optional(),
      drugs: z.enum(["yes", "no", ""]).optional(),
      otherDrugs: z.string().max(200).optional(),
      caffeine: z.enum(["yes", "no", ""]).optional(),
      caffeineCups: z.string().max(20).optional(),
      exercise: z.enum(["daily", "weekly", "occasionally", "rarely", ""]).optional(),
      specialDiet: z.enum(["yes", "no", ""]).optional(),
      dietDetails: z.string().max(200).optional(),
    })
    .optional(),
  pharmacy: z
    .object({
      name: z.string().max(120).optional(),
      phone: z.string().max(30).optional(),
      street: z.string().max(200).optional(),
      city: z.string().max(80).optional(),
      province: z.string().max(40).optional(),
      postalCode: z.string().max(20).optional(),
    })
    .optional(),
  consent: z.object({
    accurateInfo: z.literal(true),
    privacyAck: z.literal(true),
    treatmentConsent: z.literal(true),
    communicationConsent: z.boolean().optional(),
    signedName: z.string().min(2).max(120),
  }),
});

export type IntakeData = z.infer<typeof intakeSchema>;

export const MEDICAL_CONDITIONS = [
  "Anemia",
  "Arthritis Conditions",
  "Asthma",
  "Atrial Fibrillation",
  "Bleeding Problems",
  "Benign Prostatic Hyperplasia",
  "Coronary Artery Disease",
  "Cancer",
  "Cardiac Arrest",
  "Celiac Disease",
  "Chest Pain",
  "Congestive Heart Failure",
  "Chronic Fatigue Syndrome",
  "Depression",
  "Diabetes",
  "Drug/Alcohol Abuse",
  "Erectile Dysfunction",
  "Fibromyalgia",
  "GERD",
  "Heart Disease",
  "Hyperinsulinemia",
  "Hyperlipidemia",
  "Hypertension",
  "Male Hypogonadism",
  "Hypothyroidism",
  "Infection Problems",
  "Insomnia",
  "Irritable Bowel Syndrome",
  "Kidney Problems",
  "Menopause",
  "Migraines/Headaches",
  "Neuropathy",
  "Onychomycosis",
  "Organ Injury",
  "Osteoporosis",
  "Pulmonary Embolism",
  "Seizure Disorders",
  "Shortness of Breath",
  "Sinus Conditions",
  "Stroke",
  "Syndrome X",
  "Tremors",
  "Wheat Allergy",
] as const;

export const PAIN_DESCRIPTORS = [
  "Aching",
  "Numbness",
  "Spasming",
  "Throbbing",
  "Cramping",
  "Shock-like",
  "Squeezing",
  "Tingling",
  "Dull",
  "Shooting",
  "Stabbing/Sharp",
  "Tiring/Exhausting",
  "Hot/Burning",
] as const;
