import type { PolicyType } from "@/db/schema";

export type DraftPolicy = {
  policyType: PolicyType;
  version: string;
  title: string;
  contentMarkdown: string;
};

const DISCLAIMER = `

---

**DRAFT — NOT LEGAL ADVICE.** These documents are initial drafts for Clover Community Healthcare Inc. (placeholder organization details). They must be reviewed and finalized by qualified Canadian legal and privacy professionals before production use. This portal does **not** claim automatic compliance with PIPEDA, provincial health privacy laws, or any medical certification solely by publishing these texts.
`;

export const DRAFT_POLICIES: DraftPolicy[] = [
  {
    policyType: "terms",
    version: "1.0.0",
    title: "Terms and Conditions",
    contentMarkdown: `# Terms and Conditions (Draft)

**Effective date:** To be confirmed  
**Organization:** Clover Community Healthcare Inc. (placeholder)  
**Contact:** privacy@example-clover.ca | support@example-clover.ca

## 1. Purpose and scope
This Client Support Portal provides non-emergency administrative and care-coordination support for registered clients in Canada. It is not an emergency service and does not replace clinical care.

## 2. User accounts and security
You must keep credentials confidential, use a strong password, and notify us of suspected unauthorized access. We may suspend accounts that pose a security or privacy risk.

## 3. Client and assistant responsibilities
Clients must provide accurate information and use the portal only for legitimate support requests. Assistants must follow role permissions and organizational policies. Admins manage accounts, assignments, and settings.

## 4. Tickets and messaging
Tickets and chat are for support coordination. Do not use the portal for medical emergencies. Call local emergency services when urgent care is required.

## 5. Prohibited uses
Harassment, fraud, unauthorized access, uploading malware, scraping, or attempting to access another person's data is prohibited.

## 6. Suspension and termination
We may suspend or terminate access for policy violations, legal requirements, or security incidents.

## 7. Liability limitations
Subject to applicable law, the portal and support service are provided as-is for coordination purposes. Clinical decisions remain with appropriate healthcare professionals.

## 8. Governing law
Governing law and venue will be finalized for the applicable Canadian province or territory.

## 9. Updates
Material changes may require renewed acceptance. Continued use after notice may not alone constitute acceptance where renewed consent is required.
${DISCLAIMER}`,
  },
  {
    policyType: "privacy",
    version: "1.0.0",
    title: "Privacy Policy",
    contentMarkdown: `# Privacy Policy (Draft)

**Effective date:** To be confirmed  
**Organization:** Clover Community Healthcare Inc. (placeholder)  
**Privacy contact:** privacy@example-clover.ca

## 1. Purpose
This policy describes how we collect, use, disclose, retain, and protect personal information in connection with the Client Support Portal, with Canadian privacy considerations including PIPEDA and, where applicable, provincial or territorial health privacy laws.

## 2. Information we collect
Account details (name, email), optional profile fields (phone, province), ticket content, chat messages, session metadata (start/end times), audit logs of administrative actions, and policy acceptance records. We apply data minimization: collect only what is needed to operate support.

## 3. Use of information
We use information to authenticate users, operate tickets and chat, assign assistants, measure session duration (not billable time unless a separate billing policy is approved), improve service quality, meet legal obligations, and respond to access/correction requests.

## 4. Disclosure
We do not sell personal information. Disclosure may occur to authorized staff, subprocessors under contract, or as required by law. Assess data residency and subprocessors (including database and hosting providers) before processing regulated health information in production.

## 5. Cross-border processing
If personal information is processed outside Canada, we will identify those arrangements and contractual safeguards. Do not assume any cloud provider is automatically suitable for regulated health information.

## 6. Retention and deletion
We retain records as needed for support operations, auditing, and legal requirements. You may request account deletion or correction subject to legal retention obligations.

## 7. Security
We use encryption in transit (HTTPS), hashed passwords, HTTP-only sessions, role-based access, audit logging, and infrastructure encryption at rest where configured. No system is perfectly secure; report incidents to privacy@example-clover.ca.

## 8. Breach notification
Security incidents will be assessed and notified in accordance with applicable Canadian requirements and organizational policy.

## 9. Your rights
Depending on jurisdiction, you may request access, correction, withdrawal of optional consent, and complaints to the relevant privacy commissioner. Mandatory terms acceptance is separate from optional marketing consent (we do not use optional marketing by default).

## 10. Complaints
Contact privacy@example-clover.ca. You may also contact the Office of the Privacy Commissioner of Canada or your provincial/territorial commissioner where applicable.
${DISCLAIMER}`,
  },
  {
    policyType: "acceptable_use",
    version: "1.0.0",
    title: "Acceptable Use Policy",
    contentMarkdown: `# Acceptable Use Policy (Draft)

## Permitted use
Use the portal only for legitimate client support related to Clover Community Healthcare Inc. services.

## Prohibited
- Attempting to access another user's tickets, messages, or accounts
- Sharing credentials
- Posting unlawful, abusive, or discriminatory content
- Circumventing security or rate limits
- Using the portal for emergencies or clinical diagnosis

## Enforcement
Violations may result in suspension, termination, and referral to authorities where required.
${DISCLAIMER}`,
  },
  {
    policyType: "disclaimer",
    version: "1.0.0",
    title: "Support Service Disclaimer",
    contentMarkdown: `# Support Service Disclaimer (Draft)

The Client Support Portal provides administrative and care-coordination support only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. For emergencies, call your local emergency number immediately.

Session timers record assistant time spent in chat sessions for operational monitoring. They are **not** billable time unless a separate approved billing policy is adopted.

This application and its draft policies do **not** constitute legal approval, medical certification, or a claim of full compliance with Canadian healthcare privacy law.
${DISCLAIMER}`,
  },
];

export function getPolicyByType(type: PolicyType) {
  return DRAFT_POLICIES.find((p) => p.policyType === type)!;
}
