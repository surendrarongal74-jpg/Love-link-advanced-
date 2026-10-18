# DATA BREACH RESPONSE RUNBOOK
**Statutory Basis:** Section 8(6) of the Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, India) & CERT-In Cyber Security Directions  
**Entity:** Love Link Digital Sanctuary (India) Private Limited  
**Designated Officer:** Priyadarshini Rao, Data Protection & Grievance Redressal Officer  
**Official Incident Dispatch:** `grievance-dpdp@love-link.app` / `security@love-link.app`  
**Classification:** Restricted / Internal Operational Protocol

---

## 1. Statutory Mandate & Purpose
Under **Section 8(6) of the DPDP Act, 2023**:
> *"In the event of a personal data breach, the Data Fiduciary shall give the Board and each affected Data Principal, intimation of such breach in such form and manner as may be prescribed."*

This Runbook establishes a binding, operational protocol to detect, contain, investigate, and notify the **Data Protection Board of India (DPBI)** and affected **Data Principals (Users)** within the **strict statutory 72-hour window**.

---

## 2. Statutory 72-Hour Response Timeline Matrix

```
[ Hour 0: Breach Discovered / Verified ]
   │
   ▼
[ Hour 0 – 4: Phase 1 — Detection, Containment & Isolation ]
   • Convene Incident Response Team (IRT).
   • Revoke compromised API keys, isolate affected Firestore collections, rotate encryption secrets.
   • Freeze forensic log snapshots; isolate network access.
   │
   ▼
[ Hour 4 – 24: Phase 2 — Forensic Investigation & Impact Assessment ]
   • Determine categories of personal data compromised (Account, Messages, Photos, Audio, Location).
   • Calculate number of unique Data Principals (users and paired couple spaces) affected.
   • Determine whether end-to-end ciphertext or plaintext was exposed.
   │
   ▼
[ Hour 24 – 48: Phase 3 — Remediation & Statutory Notice Preparation ]
   • Patch technical vulnerability (fail-open fallbacks, Firestore rules, API endpoints).
   • Draft Form 1 Notice for Data Protection Board of India (DPBI).
   • Draft Plain-English Data Principal Notice.
   • Convene emergency review with Legal Counsel and Grievance Officer.
   │
   ▼
[ Hour 48 – 72: Phase 4 — Mandatory Statutory Disclosures & Support ]
   • TRANSMIT formal intimation to the Data Protection Board of India (DPBI).
   • TRANSMIT incident report to CERT-In (incident@cert-in.org.in within 6 hours of cyber incident).
   • DEPLOY user breach notices via verified email and in-app emergency banner.
   • Mobilize Grievance Redressal Cell for priority user inquiries.
```

---

## 3. Incident Response Team (IRT) Roster & Responsibilities

| Role | Primary Officer | Emergency Contact | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Incident Commander & DPO** | Priyadarshini Rao | `grievance-dpdp@love-link.app` | Overall regulatory command, DPBI notifications, user communications sign-off. |
| **Lead Security Engineer** | Core Backend Lead | `security@love-link.app` | Technical containment, log forensics, vulnerability patching, key rotation. |
| **Legal Counsel** | External Indian Privacy Counsel | `legal@love-link.app` | Legal liability review, DPDP statutory compliance, law enforcement liaison. |
| **Communications Lead** | Support Desk Lead | `support@love-link.app` | User email dispatch, support ticket triaging, helpline staffing. |

---

## 4. Breach Severity Classification Matrix

| Severity Level | Definition & Criteria | Action Plan |
| :--- | :--- | :--- |
| **P1 - Critical** | Exposure or exfiltration of decrypted messages, intimate photos, voice recordings, or database-wide user credentials (>50 couples). | Full 72h DPBI notification + individual user email + emergency app banner. |
| **P2 - High** | Unauthorized access to account profiles (emails, names, couple space IDs) or unencrypted location coordinates without media exposure. | Full 72h DPBI notification + individual user email. |
| **P3 - Medium** | Transient exposure of encrypted ciphertext bundles without cryptographic key compromise; isolated partner unlinking glitch. | Internal containment + DPO assessment; DPBI advisory notification. |
| **P4 - Low** | Near-miss attempt, unsuccessful brute-force scanning, isolated user-level device theft. | Internal logging; security review; no mandatory external notice required. |

---

## 5. TEMPLATE: Formal Notice to the Data Protection Board of India (DPBI)
*(To be transmitted to the Data Protection Board of India pursuant to Section 8(6) of the DPDP Act, 2023)*

```
FORM DPDP-BN-1: INTIMATION OF PERSONAL DATA BREACH TO THE DATA PROTECTION BOARD OF INDIA
Pursuant to Section 8(6) of the Digital Personal Data Protection Act, 2023

1. DETAILS OF THE DATA FIDUCIARY:
   a. Legal Name: Love Link Digital Sanctuary (India) Private Limited
   b. CIN / Registration No.: [LEGAL REVIEW REQUIRED - INSERT CIN]
   c. Registered Address: Cyber Park, Tower B, 4th Floor, Sector 62, Noida, Uttar Pradesh 201309, India
   d. Data Protection Grievance Officer: Priyadarshini Rao (grievance-dpdp@love-link.app)

2. PARTICULARS OF THE BREACH:
   a. Date and Time of Occurrence: [YYYY-MM-DD HH:MM IST]
   b. Date and Time of Detection: [YYYY-MM-DD HH:MM IST]
   c. Duration of Compromise: [X hours / minutes]
   d. Nature of Breach: [Unauthorized Access / Exfiltration / Ransomware / Cloud Misconfiguration]

3. CATEGORIES & VOLUME OF PERSONAL DATA AFFECTED:
   [ ] User Account Identifiers (Google Email, Display Name, UID)
   [ ] Couple Space Relationship Metadata (Pairing codes, anniversary dates)
   [ ] Encrypted Messages / Notes
   [ ] Intimate Media / Voice Recordings / Photo Scrapbooks
   [ ] Geolocation Coordinates (Google Maps pins)
   Estimated Number of Affected Data Principals: [Insert Count]
   Estimated Number of Impacted Couple Spaces: [Insert Count]

4. TECHNICAL ROOT CAUSE ANALYSIS:
   [Describe technical vulnerability: e.g. database rule regression, API token exposure, fail-open encryption fallback]

5. ASSESSMENT OF LIKELY HARM & REPERCUSSIONS:
   [Provide objective assessment of impact: risk of privacy violation, emotional distress, unauthorized disclosure]

6. IMMEDIATE CONTAINMENT & MITIGATION MEASURES IMPLEMENTED:
   a. [e.g. Invalidated all active user session tokens and rotated AES encryption salts]
   b. [e.g. Applied restrictive Firestore security rules and blocked unauthorized IP ranges]
   c. [e.g. Conducted full forensic database dump analysis]

7. REMEDIAL ACTIONS TAKEN TO PREVENT RECURRENCE:
   [List permanent architecture fixes, penetration testing, automated security gating]

8. DATA PRINCIPAL NOTIFICATION STATUS:
   Notifications dispatched to all affected Data Principals on: [Date/Time] via registered email.

Submitted by:
Priyadarshini Rao, Data Protection Officer
Love Link Digital Sanctuary (India) Private Limited
Date: [Insert Date]
```

---

## 6. TEMPLATE: Individual Notice to Affected Data Principals (Users)
*(To be sent via registered email and displayed via high-priority in-app notification)*

```
SUBJECT: Important Security Notification Regarding Your Love Link Account

Dear [User Name / Couple],

We are writing to inform you of a personal data security incident that affected Love Link, the steps we have taken in response, and the measures you can take to protect your privacy.

1. WHAT HAPPENED?
On [Date] at approximately [Time IST], our security monitoring detected unauthorized access to [describe system component, e.g. an auxiliary cloud database replica]. We immediately initiated our containment protocols, patched the vulnerability, and launched a comprehensive forensic investigation with external cybersecurity specialists.

2. WHAT DATA WAS INVOLVED?
Our investigation confirms that the following categories of information were involved in this incident:
• [List specific data fields: e.g. Display names, registered Google email addresses, and couple space ID]

WHAT WAS NOT INVOLVED:
• Financial or credit card information was NOT involved (Love Link never collects or stores payment cards).
• Passwords were NOT involved (we use Google OAuth identity authentication).
• [If end-to-end ciphertext remained intact: Intimate voice notes and chat contents remained protected by AES-GCM 256-bit encryption].

3. WHAT IMMEDIATE ACTIONS HAVE WE TAKEN?
• We neutralized the intrusion vector within [X hours] of detection.
• We rotated all cloud access keys, database credentials, and service tokens.
• In compliance with Section 8(6) of the Digital Personal Data Protection Act, 2023, we have formally notified the Data Protection Board of India (DPBI) and CERT-In.
• We have implemented additional real-time intrusion monitoring and automated threat detection.

4. WHAT CAN YOU DO?
While our containment measures have secured the service, we recommend the following precautions:
• Review your active couple space settings and re-verify your paired partner.
• You can execute an instant local device vault purge anytime in App Settings > Purge Local Vault.
• Be vigilant against unsolicited phishing emails or messages claiming to represent Love Link.

5. FOR QUESTIONS AND ASSISTANCE:
Your intimacy and trust are the foundation of Love Link. If you have any questions or require personalized assistance, our designated Data Protection Grievance Officer is available directly:

Officer: Priyadarshini Rao
Designation: Data Protection & Grievance Redressal Officer
Dedicated Email: grievance-dpdp@love-link.app
Statutory Response SLA: Acknowledgment within 48 hours; resolution within 30 days.

Sincerely,
The Love Link Security & Privacy Team
Love Link Digital Sanctuary (India) Private Limited
Cyber Park, Sector 62, Noida, Uttar Pradesh 201309, India
```

---

## 7. Forensic Evidence Preservation Checklist
- [ ] Export and hash all server access logs (`/var/log`, Cloud Run logs, Cloud Logging).
- [ ] Preserve Firestore access audit logs and security rule evaluations.
- [ ] Snapshot affected virtual machine or container memory states if applicable.
- [ ] Document chain of custody for all digital evidence.
- [ ] Retain all incident records and communications for a statutory minimum of **3 years**.
