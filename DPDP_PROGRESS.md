# DPDP Compliance Audit & Implementation Progress Log
**Legislation:** Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, Parliament of India)  
**Git Branch:** `compliance/dpdp` (Local audit branch; not pushed)  
**Audit Date:** October 2026  
**Auditor / Engineering Lead:** AI Studio Engineering & Privacy Compliance Agent  
**Data Fiduciary:** Love Link Digital Sanctuary (India) Private Limited  

---

## Executive Summary
This audit evaluated the Love Link codebase against the statutory compliance mandates of the **Digital Personal Data Protection Act, 2023 (DPDP Act)** of India. Love Link operates as a private relationship application for couples handling highly sensitive, intimate personal data (encrypted chat messages, voice notes, photos, couple diaries, love streaks, and geolocation coordinates).

All nine (9) required audit and implementation deliverables have been designed, integrated, and verified on the local `compliance/dpdp` branch.

---

## 1. Audit Findings: Personal Data Collection Points & Third Parties

### 1.1 Personal Data Collection Points
| Collection Point | Component / Route | Categories of Personal Data Collected | Statutory Sensitivity |
| :--- | :--- | :--- | :--- |
| **User Sign-In** | `src/screens/AuthScreen.tsx` | Google Display Name, Google Email, Profile Avatar URL, Google UID, Client IP. | General PII / Account Credentials |
| **Partner Pairing** | `src/screens/OnboardingScreen.tsx` | 6-character invite code, partner UID, relationship space ID, pairing timestamps. | Interpersonal / Relationship Metadata |
| **Intimate Messaging** | `src/screens/ChatScreen.tsx` | Text messages, voice recordings (audio blobs), photo drawings, timestamps, read receipts. | High Sensitivity (Intimate Communications) |
| **Shared Scrapbook** | `src/screens/MemoriesScreen.tsx` | Milestone titles, anniversary dates, uploaded couple photographs, story descriptions. | High Sensitivity (Personal Moments) |
| **Interactive Map** | `src/screens/LoveMapScreen.tsx` | Device GPS coordinates (latitude/longitude), pin addresses, place markers, visited dates. | High Sensitivity (Continuous Geolocation) |
| **Secret Couple Diary** | `src/screens/DiaryScreen.tsx` | Daily mood entries, emotional ratings, private reflections, secret thoughts. | Sensitive Behavioral / Mood Telemetry |
| **AI Love Companion** | `src/screens/AiraScreen.tsx`, `src/screens/AIPlannerScreen.tsx` | Prompts containing relationship dynamics, date planning preferences, chat history. | AI Contextual Data |
| **Calling System** | `src/contexts/CallContext.tsx` | WebRTC audio/video media streams, microphone input, camera input, network ICE candidates. | Real-Time Biometric / Sensory Streams |

### 1.2 Trackers & Third-Party Processors Identified
| Service / SDK | Location in Code | Purpose | DPDP Classification & Processing Basis |
| :--- | :--- | :--- | :--- |
| **Google Firebase Auth & Firestore** | `src/lib/firebase.ts`, `server.ts` | Identity verification, user database, real-time sync across couple devices. | **Data Processor** (Core Essential; contractually processed in whitelisted cloud regions). |
| **Google Maps Platform** | `@react-google-maps/api` in `LoveMapScreen.tsx` | Renders interactive maps, pins, and distance calculation. | **Third-Party Tracker & Processor** (Non-essential; gated behind opt-in consent). |
| **Google Gemini AI API** | `@google/genai` in `server.ts` (`/api/aira/chat`, `/api/date-planner/chat`) | Powers AIRA suggestions, date plans, romantic advice. | **Third-Party Processor** (Optional feature; gated behind opt-in consent). |
| **Google STUN Servers** | `stun:stun.l.google.com:19302` in `CallContext.tsx` | WebRTC NAT traversal for peer-to-peer audio/video calls. | **Technical Utility** (Ephemeral IP signaling only; no media stored). |
| **Local Device Vaults** | `localStorage`, `IndexedDB` (`persistentLocalCache`) | Offline persistence, cryptographic keys, client encryption cache. | **Device Storage** (Essential; subject to Right to Erasure). |

---

## 2. Key Implementations Completed

### 2.1 Privacy Notice Page (DPDP Sections 5 & 6)
- **Component:** `src/components/legal/DPDPPrivacyNotice.tsx` embedded in `/privacy` and `/privacy-notice` via `PublicInfoScreen.tsx`.
- **Content:** Explicit breakdown of data categories collected, lawful purposes, cloud retention schedules (30-day post-unlinking erasure), third-party processor disclosures, full enumeration of Data Principal rights (Access, Correction, Erasure, Nomination, Consent Withdrawal), age verification restriction (18+), and Grievance Officer contacts.
- **Legal Flag:** Prominently tagged with `[LEGAL REVIEW REQUIRED - DRAFT NOTICE UNDER DIGITAL PERSONAL DATA PROTECTION ACT, 2023]`.

### 2.2 Granular, Unticked Per-Purpose Consent (DPDP Section 6)
- **Component:** `src/screens/AuthScreen.tsx`.
- **Design:** Replaced generic single-checkbox consent with **four (4) separate, unticked checkboxes**:
  1. *Core Account & Couple Pairing* (Required)
  2. *Encrypted Messages & Intimate Media Processing* (Required)
  3. *Geolocation & Love Map Pin Sharing* (Optional)
  4. *AI Relationship Companion (Gemini)* (Optional)
- **Verifiable Consent Storage:** Implemented in `src/lib/dpdpService.ts`:
  - Generates verifiable record (`consentId`, `userId`, `purposes`, `noticeVersion: "dpdp-2023-v1.0"`, `timestamp`, `ipNotice`, `userAgent`).
  - Persists locally in `localStorage` and replicates to Firestore `/users/{uid}/dpdp_consents/{id}` and `/api/dpdp/consent-log`.

### 2.3 Non-Essential Tracker Gating (DPDP Section 6(1))
- **Consent Banner:** `src/components/legal/ConsentBanner.tsx` mounted globally in `src/App.tsx`. Gathers cookie and tracker preferences with "Accept All", "Essential Only", and "Customize" options.
- **Google Maps Gating:** `src/screens/LoveMapScreen.tsx` prevents Google Maps JavaScript API script injection until the user affirmatively opts in to `locationMaps`. Renders an informative privacy gate fallback card.

### 2.4 Grievance Redressal Officer Publication (DPDP Section 13)
- **Component:** `src/components/legal/GrievanceContactCard.tsx`.
- **Published Details:**
  - **Officer:** Priyadarshini Rao, Data Protection & Grievance Redressal Officer
  - **Entity:** Love Link Digital Sanctuary (India) Private Limited
  - **Email:** `grievance-dpdp@love-link.app`
  - **Physical Address:** Cyber Park, Tower B, 4th Floor, Sector 62, Noida, Uttar Pradesh 201309, India
  - **SLA Timelines:** 48 hours acknowledgment; 30 calendar days resolution.
  - **Statutory Appeal:** Explicit mention of right to complain to the Data Protection Board of India (DPBI) under Section 13(3).
- **Locations Published:** Public page footers (`PublicInfoScreen.tsx`), `/privacy`, `/data-rights`, `HomeScreen.tsx` settings drawer, `TermsAndConditionsModal.tsx`.

### 2.5 Data Principal Rights Interactive Request Form (DPDP Chapter III)
- **Component:** `src/components/legal/DataRightsRequestModal.tsx` accessible via:
  - Header & footer link on `/data-rights` and `/privacy`
  - App Settings drawer in `HomeScreen.tsx`
- **Supported Statutory Rights:**
  - **Right to Access (Section 11):** Summary intake + instant self-service "Download Data Export" JSON bundle.
  - **Right to Correction (Section 12):** Intake to update inaccurate data.
  - **Right to Erasure (Section 12):** Formal deletion request intake + instant self-service "Purge Local Vault" button.
  - **Right to Withdraw Consent (Section 6(4)):** Revocation of optional location/AI processing.
  - **Right to Nominate (Section 14):** Capture nominee name, contact info, and relationship in case of death/incapacity.
- **Ticketing & Tracking:** Generates verifiable tracking code (e.g. `DPDP-ACC-XXXXX`) with automated 30-day statutory deadline countdown, local storage, Firestore logging, and backend API recording.

### 2.6 Terms of Service Statutory Data Protection Clause (DPDP Section 8)
- **Components:** `src/components/legal/TermsAndConditionsModal.tsx` and `PublicInfoScreen.tsx` (`/terms`).
- **Clause Added:** Section 5 ("Data Protection Clause (India DPDP Act, 2023)"), defining Data Principal / Data Fiduciary relationships, purpose limitations, technical safeguards, 72-hour breach notification commitments, and grievance escalation to DPBI. Marked for legal review.

### 2.7 Breach Response Runbook
- **File:** `BREACH_RUNBOOK.md`.
- **Procedures:** 72-hour statutory timeline matrix, Severity 1-4 classification, emergency IRT roster, Form DPDP-BN-1 template for the Data Protection Board of India, and plain-English user notice template.

---

## 3. Security Gaps Flagged & Technical Analysis

During the audit, three (3) significant architectural security risks were identified and analyzed:

### ⚠️ Flag 1: Fail-Open Encryption Fallback & Predictable Key Derivation
- **Location:** `src/lib/encryption.ts` (lines 10-43) & `src/screens/ChatScreen.tsx` (lines 337-346).
- **Findings:**
  1. *Predictable Key Material:* The AES-GCM 256-bit encryption key is derived using PBKDF2 with a hardcoded static salt (`LoveLink_ZeroKnowledge_Salt_2026_SecureVault`) and key material derived exclusively from `coupleSpaceId` (`rawKeyMaterial = enc.encode("LoveLink_Vault_" + coupleSpaceId)`). No user-held passphrase or asymmetric keypair is involved. Because `coupleSpaceId` is a 6-character random alphanumeric string generated in `OnboardingScreen.tsx` (`Math.random().toString(36).substring(2, 8).toUpperCase()`), the keyspace has only ~2.1 billion combinations. Anyone who discovers or brute-forces the 6-character space ID can immediately compute the AES-256 decryption key for all messages in that space.
  2. *Fail-Open Legacy Plaintext Fallback:* In `ChatScreen.tsx`:
     ```ts
     } else {
       // Legacy/Plaintext message backward compatibility
       processedList.push({ id: item.id, content: item.content, ... });
     }
     ```
     If an unencrypted message payload is posted to Firestore without `ciphertext` and `iv`, the client parses and renders it directly as plaintext rather than throwing a cryptographic integrity error. This creates a fail-open attack vector where malicious or eavesdropping actors could inject unencrypted payloads.
- **Remediation Recommended:**
  - Transition to client-side Diffie-Hellman / WebCrypto ECDH (P-256) key exchange during partner pairing.
  - Reject messages missing valid ciphertext signatures (fail-closed discipline).

### ⚠️ Flag 2: Unverified Captcha & Lack of Rate Limiting
- **Location:** `src/screens/AuthScreen.tsx`, `src/screens/OnboardingScreen.tsx`, `server.ts`.
- **Findings:**
  - No CAPTCHA (e.g. Cloudflare Turnstile, Google reCAPTCHA Enterprise) is enforced at signup, invitation code pairing, or API endpoints.
  - Combined with 6-character pairing codes, an automated script could scan and enumerate couple spaces without rate-limiting friction or bot detection.
- **Remediation Recommended:**
  - Integrate Turnstile / reCAPTCHA on the invite code redemption flow.
  - Implement server-side IP rate limiting (e.g. `express-rate-limit`) on `/api/aira/chat`, `/api/date-planner/chat`, and pairing endpoints.

### ⚠️ Flag 3: Transport Layer Security (TLS/HTTPS) Enforcement
- **Location:** `server.ts`.
- **Findings:**
  - Previously lacked explicit HTTP Strict Transport Security (`Strict-Transport-Security`) headers and X-Content-Type-Options headers.
- **Remediation Implemented:**
  - Added security middleware in `server.ts` applying:
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: SAMEORIGIN`
    - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Summary of Items Requiring Qualified Legal Counsel Review

The following legal texts and configurations are explicitly marked for formal review by qualified advocates/attorneys admitted to practice in India:

1. **Privacy Notice Legal Text (`DPDPPrivacyNotice.tsx`):**
   - Verification of legal entity corporate registration (Private Limited CIN and registered office address).
   - Validation that specific lawful purposes enumerated in Section 3 align with corporate bylaws.
   - Confirmation of 18+ adult age gating compliance under DPDP Section 9 regarding minors.
2. **Terms of Service Data Protection Clause (`TermsAndConditionsModal.tsx` & `/terms`):**
   - Enforceability of limitation of liability and mutual consent arbitration clauses under the Indian Contract Act, 1872 and DPDP Act, 2023.
3. **Data Breach Board Notice Form (`BREACH_RUNBOOK.md`):**
   - Alignment with final rules and notification forms promulgated by the Ministry of Electronics and Information Technology (MeitY) and the Data Protection Board of India (DPBI).
4. **Data Processor Agreements (DPAs):**
   - Execution of binding DPAs with Google Cloud India Private Limited / Google LLC governing Firebase, Gemini AI, and Google Maps as Data Processors pursuant to Section 8(2) of the DPDP Act.

---

## 5. Open Action Items & Roadmap

- [x] Create and checkout branch `compliance/dpdp` (do not push).
- [x] Map all personal data collection points, trackers, and third parties.
- [x] Build comprehensive DPDP Privacy Notice component and route (`/privacy`, `/privacy-notice`).
- [x] Implement per-purpose, unticked consent checkboxes and verifiable audit logging in `AuthScreen.tsx`.
- [x] Gate Google Maps and external trackers behind DPDP consent banner.
- [x] Publish Data Protection Grievance Officer details across all public views and modals.
- [x] Add interactive Data Principal Rights Request form with instant self-service export and local vault purge.
- [x] Add statutory DPDP clause to Terms of Service.
- [x] Create `BREACH_RUNBOOK.md` with 72-hour statutory DPBI and user notice templates.
- [x] Flag and document security gaps (fail-open encryption, missing captcha, transport security).
- [ ] *(Open / Post-Review)*: Integrate Cloudflare Turnstile / reCAPTCHA on the invite code redemption input.
- [ ] *(Open / Post-Review)*: Upgrade key derivation from `coupleSpaceId` to ECDH peer-to-peer key exchange.
- [ ] *(Open / Post-Review)*: Formal legal counsel sign-off on corporate entity CIN and physical registered office.
