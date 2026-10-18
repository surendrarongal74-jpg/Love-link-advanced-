// Digital Personal Data Protection (DPDP) Act, 2023 Types

export interface ConsentPurposes {
  /** Required: Processing of Google account profile to establish identity and private space pairing */
  coreSync: boolean;
  /** Required: Processing and encryption of chat messages, voice notes, photos, and diary entries */
  mediaProcessing: boolean;
  /** Optional: Processing of geolocation coordinates for Google Maps pins and distance */
  locationServices: boolean;
  /** Optional: Processing of relationship context with Google Gemini AI for date planning and AIRA */
  aiAssistance: boolean;
}

export interface ConsentRecord {
  consentId: string;
  userId: string;
  userEmail: string;
  purposes: ConsentPurposes;
  noticeVersion: string; // e.g. "dpdp-2023-v1.0"
  timestamp: number;
  isoDate: string;
  ipNotice: string;
  userAgent: string;
  withdrawn: boolean;
  withdrawnAt?: number;
}

export interface TrackerPreferences {
  necessary: boolean; // Always true (Session, pairing, crypto keys)
  locationMaps: boolean; // Google Maps JavaScript API
  aiAssistant: boolean; // Google Gemini AI API calls
  analytics: boolean; // Performance telemetry
  decidedAt: number;
}

export type DataRightsType = 
  | 'access' 
  | 'correction' 
  | 'erasure' 
  | 'withdraw_consent' 
  | 'nomination';

export interface DataRightsRequest {
  id: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  coupleSpaceId?: string;
  fullName: string;
  requestType: DataRightsType;
  details: string;
  nomineeDetails?: {
    name: string;
    contact: string;
    relationship: string;
  };
  status: 'submitted' | 'under_review' | 'completed' | 'rejected';
  submittedAt: number;
  deadlineAt: number; // 30-day statutory SLA as per DPDP Act
  resolutionNotes?: string;
}

export interface GrievanceOfficerInfo {
  name: string;
  designation: string;
  entityName: string;
  email: string;
  alternateEmail: string;
  address: string;
  slaResponseHours: number;
  slaResolutionDays: number;
  boardEscalationInfo: string;
}

export const OFFICIAL_GRIEVANCE_OFFICER: GrievanceOfficerInfo = {
  name: "Priyadarshini Rao",
  designation: "Data Protection & Grievance Redressal Officer",
  entityName: "Love Link Digital Sanctuary (India) Private Limited",
  email: "grievance-dpdp@love-link.app",
  alternateEmail: "dpo@love-link.app",
  address: "Cyber Park, Tower B, 4th Floor, Sector 62, Noida, Uttar Pradesh 201309, India",
  slaResponseHours: 48,
  slaResolutionDays: 30,
  boardEscalationInfo: "If your grievance is not redressed within 30 days, you have the right to register a complaint with the Data Protection Board of India (DPBI) as per Section 13(3) of the DPDP Act, 2023."
};
