import React from 'react';
import { Shield, Mail, MapPin, Clock, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_GRIEVANCE_OFFICER } from '../../types/dpdp';
import { sound } from '../../lib/sound';

interface Props {
  onOpenDataRightsModal?: () => void;
  compact?: boolean;
}

export function GrievanceContactCard({ onOpenDataRightsModal, compact = false }: Props) {
  const g = OFFICIAL_GRIEVANCE_OFFICER;

  return (
    <div className="bg-gradient-to-br from-rose-50/90 via-pink-50/60 to-purple-50/70 border border-rose-200/80 rounded-3xl p-5 shadow-sm text-xs text-gray-800 space-y-4 font-sans">
      <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-tight">Data Protection & Grievance Officer</h3>
            <p className="text-[11px] text-rose-600 font-medium">Under India DPDP Act, 2023 (Section 13)</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
          SLA: 30 Days
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Designated Officer</span>
          <p className="font-semibold text-gray-900">{g.name}</p>
          <p className="text-gray-500 text-[10px]">{g.designation}</p>
          <p className="text-gray-600 font-medium">{g.entityName}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Official Contacts</span>
          <a 
            href={`mailto:${g.email}?subject=DPDP%20Grievance%20or%20Inquiry`}
            onClick={() => sound.tap()}
            className="flex items-center gap-1.5 text-rose-600 font-semibold hover:underline"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>{g.email}</span>
          </a>
          <p className="text-gray-500 text-[10px]">Alternate: {g.alternateEmail}</p>
        </div>
      </div>

      {!compact && (
        <div className="space-y-2 pt-1 border-t border-rose-100/80">
          <div className="flex items-start gap-2 text-[11px] text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{g.address}</span>
          </div>

          <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-white/70 p-2.5 rounded-2xl border border-rose-100">
            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Timelines:</strong> Acknowledgment within <strong>48 hours</strong>; statutory grievance resolution or response within <strong>30 calendar days</strong>.
            </span>
          </div>

          <div className="text-[10px] text-gray-500 leading-relaxed bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-2xl">
            <strong className="text-amber-900 block mb-0.5">Appeals to Data Protection Board of India (DPBI):</strong>
            {g.boardEscalationInfo}
          </div>
        </div>
      )}

      {onOpenDataRightsModal && (
        <div className="pt-1">
          <button
            onClick={() => {
              sound.tap();
              onOpenDataRightsModal();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-rose-300 hover:border-rose-400 text-rose-700 font-bold text-xs shadow-xs hover:bg-rose-50/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Exercise Data Principal Rights (Access / Erasure / Correction)</span>
          </button>
        </div>
      )}
    </div>
  );
}
