import React from 'react';
import { GuideTutorialItem } from '../data/guideTutorialData';
import {
  HelpCircle,
  X,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  BookOpen,
  Eye,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface GuideDetailModalProps {
  item: GuideTutorialItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabKey: string) => void;
}

export const GuideDetailModal: React.FC<GuideDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with gradient and category badge */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1E7A44] p-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#8CC63F]/20 text-[#8CC63F] border border-[#8CC63F]/30">
                {item.category}
              </span>
              <span className="text-xs text-emerald-100 flex items-center gap-1 font-semibold">
                <BookOpen className="h-3.5 w-3.5 text-[#8CC63F]" /> Guide Interactif & Tutoriel
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1 leading-snug flex items-center gap-2">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Fermer le guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Detailed summary */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-[#1E7A44]" /> Présentation & Rôle du Module
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              {item.description}
            </p>
          </div>

          {/* Step-by-step objectives */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#1E7A44]" /> Parcours Pas à Pas & Objectifs Clés
            </h4>
            <div className="space-y-2">
              {item.objectifs.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/60">
                  <div className="h-5 w-5 rounded-full bg-[#1E7A44] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-xs text-slate-800 font-medium leading-normal">{obj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro tip card */}
          <div className="bg-amber-50/80 border border-amber-200/70 p-4 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Lightbulb className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-amber-900 tracking-wide block">
                💡 Conseil d'Expert du Cultivateur
              </span>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {item.conseilPro}
              </p>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Tutoriel intégré MEFOUP-FLOW SIG-ERP
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToTab && (
              <button
                onClick={() => {
                  onNavigateToTab(item.tabKey);
                  onClose();
                }}
                className="bg-[#1E7A44] hover:bg-[#0F3D2E] text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Eye className="h-3.5 w-3.5 text-[#8CC63F]" />
                Accéder au module
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
