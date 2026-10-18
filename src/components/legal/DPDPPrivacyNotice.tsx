import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  UserCheck, 
  Globe, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Scale, 
  Building, 
  Share2, 
  Clock, 
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OFFICIAL_GRIEVANCE_OFFICER } from '../../types/dpdp';
import { GrievanceContactCard } from './GrievanceContactCard';
import { sound } from '../../lib/sound';

interface Props {
  onOpenDataRightsModal?: () => void;
}

export function DPDPPrivacyNotice({ onOpenDataRightsModal }: Props) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    sound.tap();
    setExpandedSection(expandedSection === idx ? null : idx);
  };

  const g = OFFICIAL_GRIEVANCE_OFFICER;

  return (
    <div className="space-y-6 text-xs text-gray-700 leading-relaxed font-sans">
      {/* Legal Banner Flag */}
      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-800">
          <Scale className="w-4 h-4 text-amber-600" />
          <span>[LEGAL REVIEW REQUIRED - DRAFT NOTICE UNDER DIGITAL PERSONAL DATA PROTECTION ACT, 2023]</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          This privacy notice is drafted to comply with the statutory transparency requirements under Section 5 and Section 6 of the Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, India). Final operational legal sign-off from qualified Indian legal counsel is required before full enterprise deployment.
        </p>
      </div>

      {/* Core Intimacy Statement */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border border-rose-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
          <Lock className="w-4 h-4 text-rose-500" />
          <span>Our Digital Sanctuary Promise</span>
        </div>
        <p className="text-[11px] text-rose-950 leading-relaxed">
          Love Link is an encrypted two-person digital sanctuary. We act as a <strong>Data Fiduciary</strong> strictly to facilitate intimate connection between two consenting partners. We do not sell your personal data, conduct behavioral advertising, monetise your chat logs, or build advertising profiles.
        </p>
      </div>

      {/* Structured Notice Sections */}
      <div className="space-y-3">
        {/* Section 1 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(1)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <Building className="w-4 h-4 text-rose-500" />
              1. Data Fiduciary Identity & Registered Entity
            </span>
            {expandedSection === 1 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 1 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2 text-gray-600">
              <p>
                Under Section 2(i) of the DPDP Act, the <strong>Data Fiduciary</strong> determining the purpose and means of personal data processing is:
              </p>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 space-y-1 font-mono text-[10px]">
                <div><strong>Entity:</strong> {g.entityName}</div>
                <div><strong>Corporate Identity:</strong> Private Limited Company incorporated in India</div>
                <div><strong>Registered Office:</strong> {g.address}</div>
                <div><strong>Official Contact:</strong> {g.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(2)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <FileCheck className="w-4 h-4 text-indigo-500" />
              2. What Digital Personal Data We Collect
            </span>
            {expandedSection === 2 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 2 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2 text-gray-600">
              <p>We process only digital personal data essential to providing your shared couple space:</p>
              <ul className="list-disc pl-4 space-y-1.5 marker:text-rose-400">
                <li>
                  <strong className="text-gray-800">Account Profile:</strong> Display name, Google email address, profile avatar URL, unique Google user ID.
                </li>
                <li>
                  <strong className="text-gray-800">Intimate Communications & Media:</strong> Text messages, voice recordings (audio blobs), photo drawings/canvas, and love notes transmitted with end-to-end client encryption.
                </li>
                <li>
                  <strong className="text-gray-800">Relationship Milestones & Quizzes:</strong> Anniversary dates, milestone photographs in memories, love streak counters, secret diary entries, and love language quiz answers.
                </li>
                <li>
                  <strong className="text-gray-800">Geolocation Data (Opt-In Only):</strong> Coordinates (latitude and longitude) and pin addresses submitted by you on Love Map.
                </li>
                <li>
                  <strong className="text-gray-800">Device & Connection Telemetry:</strong> IP address, user agent string, push notification tokens, and WebRTC network candidate IPs required for real-time voice/video calls.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 3 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(3)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <Share2 className="w-4 h-4 text-purple-500" />
              3. Lawful Purposes of Processing & Third-Party Processors
            </span>
            {expandedSection === 3 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 3 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2.5 text-gray-600">
              <p>
                In compliance with Section 4 and Section 6 of the DPDP Act, personal data is processed solely for specified, lawful purposes backed by affirmative consent:
              </p>
              
              <div className="space-y-2">
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <div className="font-bold text-gray-800 text-xs">A. Google Cloud Platform & Firebase (Data Processor)</div>
                  <p className="text-[10px]">
                    <strong>Role:</strong> Cloud database, authentication, and encrypted data hosting.
                    <br /><strong>Location:</strong> Whitelisted cloud data centers (compliant with DPDP cross-border regulations).
                  </p>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <div className="font-bold text-gray-800 text-xs">B. Google Maps Platform (Optional Data Processor)</div>
                  <p className="text-[10px]">
                    <strong>Role:</strong> Renders shared couple map pins and distance calculations. Loaded strictly after affirmative tracker consent.
                  </p>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <div className="font-bold text-gray-800 text-xs">C. Google Gemini AI API (Optional Relationship Assistant)</div>
                  <p className="text-[10px]">
                    <strong>Role:</strong> Powers AIRA suggestions and Date Planner itineraries when requested by user. Prompts are not used for public model training.
                  </p>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                  <div className="font-bold text-gray-800 text-xs">D. Google STUN Network</div>
                  <p className="text-[10px]">
                    <strong>Role:</strong> Facilitates NAT traversal for direct peer-to-peer WebRTC audio/video calls between paired devices. Media is not stored on STUN servers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(4)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-amber-500" />
              4. Data Retention and Erasure Schedule (Section 8(7))
            </span>
            {expandedSection === 4 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 4 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2 text-gray-600">
              <p>
                In accordance with Section 8(7) of the DPDP Act, personal data shall be erased upon the purpose being served or upon withdrawal of consent:
              </p>
              <ul className="list-disc pl-4 space-y-1 marker:text-rose-400">
                <li><strong>Active Couple Space:</strong> Retained while the couple relationship space remains active.</li>
                <li><strong>Unlinked / Dissolved Spaces:</strong> Data is scheduled for complete cloud erasure within 30 days of unlinking.</li>
                <li><strong>Local Device Cache:</strong> Can be immediately wiped anytime by clicking <em>"Purge Local Vault"</em> in settings.</li>
                <li><strong>Statutory Retention:</strong> Consent records and rights request logs are retained for audit and legal compliance for up to 3 years.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 5 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(5)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              5. Statutory Rights of the Data Principal
            </span>
            {expandedSection === 5 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 5 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2.5 text-gray-600">
              <p>As a Data Principal under Chapter III of the DPDP Act, 2023, you hold the following statutory rights:</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <strong className="text-emerald-900 block text-xs">Right to Access Summary (Section 11)</strong>
                  <p className="text-[10px]">Obtain a summary of personal data processed, identities of all third parties shared with, and copy of your data.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <strong className="text-emerald-900 block text-xs">Right to Correction & Erasure (Section 12)</strong>
                  <p className="text-[10px]">Correct inaccurate data, complete incomplete records, or require erasure of your personal data.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <strong className="text-emerald-900 block text-xs">Right of Grievance Redressal (Section 13)</strong>
                  <p className="text-[10px]">Direct complaints to our designated Grievance Officer with guaranteed acknowledgment within 48 hours.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <strong className="text-emerald-900 block text-xs">Right to Nominate (Section 14)</strong>
                  <p className="text-[10px]">Nominate another individual to exercise your rights in the event of death or incapacity.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <strong className="text-emerald-900 block text-xs">Right to Withdraw Consent (Section 6(4))</strong>
                  <p className="text-[10px]">Withdraw any previously granted consent with the same ease with which it was provided.</p>
                </div>
              </div>

              {onOpenDataRightsModal && (
                <div className="pt-2">
                  <button
                    onClick={onOpenDataRightsModal}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Data Principal Rights Request Form</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 6 */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <button
            onClick={() => toggleSection(6)}
            className="w-full p-3.5 text-left font-bold text-gray-900 flex items-center justify-between hover:bg-rose-50/40 transition"
          >
            <span className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              6. Protection of Children & Age Verification (Section 9)
            </span>
            {expandedSection === 6 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {(expandedSection === 6 || expandedSection === null) && (
            <div className="p-4 pt-1 border-t border-gray-100 text-[11px] space-y-2 text-gray-600">
              <p>
                Love Link is strictly designed for adults (individuals of 18 years or older). Pursuant to Section 9 of the DPDP Act:
              </p>
              <ul className="list-disc pl-4 space-y-1 marker:text-rose-400">
                <li>We do not knowingly process personal data of children (under 18 years) or persons with disabilities without verifiable parental consent.</li>
                <li>We strictly prohibit behavioral tracking, targeted advertising, and processing that causes any detrimental effect on children.</li>
                <li>Any account discovered to belong to an underage individual without lawful parental authorization will be promptly purged.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Grievance Redressal Card & Contact */}
      <div className="pt-2">
        <GrievanceContactCard onOpenDataRightsModal={onOpenDataRightsModal} />
      </div>
    </div>
  );
}
