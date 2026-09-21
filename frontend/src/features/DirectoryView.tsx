import React from 'react';
import {
  Shield,
  Phone,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { StaffContact, PoliceOfficer } from '../types';

interface DirectoryViewProps {
  staff: StaffContact[];
  policeOfficer: PoliceOfficer;
  garbage: {
    dailyCollection: string;
    bulkyWaste: string;
    recycling: string;
    platformStatus: string;
  };
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  staff,
  policeOfficer,
  garbage,
}) => {
  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Службы, персонал и участковый</h2>
        <p className="text-xs text-slate-400">Графики работы специалистов МКД и контакты правопорядка</p>
      </div>

      {/* 1. District Police Officer Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#121929] to-[#0c111e] border border-blue-500/30 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                Правопорядок района
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{policeOfficer.name}</h3>
              <p className="text-xs text-slate-300">{policeOfficer.rank}</p>
            </div>
          </div>

          <a
            href={`tel:${policeOfficer.phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Позвонить</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
          <div className="flex items-start gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block">Опорный пункт полиции</span>
              <span>{policeOfficer.stationAddress}</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 block">Часы личного приема граждан</span>
              <span>{policeOfficer.receptionHours}</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
          Зона ответственности: {policeOfficer.district}
        </div>
      </div>

      {/* 2. Building Staff with working hours */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Персонал дома и часы работы (с X до X)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {staff.map((person) => (
            <div
              key={person.id}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">{person.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{person.role}</p>
                </div>
                {person.emergencyAvailable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium">
                    24/7
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-medium">{person.workingHours}</span>
                </div>
                {person.dutyArea && (
                  <div className="text-[10px] text-slate-500 truncate">
                    Зона: {person.dutyArea}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">{person.phone}</span>
                <a
                  href={`tel:${person.phone.replace(/[^0-9+]/g, '')}`}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3 h-3 text-purple-400" />
                  <span>Вызов</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Garbage Collection Schedule */}
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Вывоз мусора и эко-пункт</h3>
              <p className="text-[11px] text-slate-400">График регионального оператора ТКО</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Площадка убрана
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[11px] font-medium text-white block">Бытовой мусор (ТКО)</span>
            <p className="text-[11px] text-slate-400">{garbage.dailyCollection}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[11px] font-medium text-white block">Крупногабаритный мусор (КГО)</span>
            <p className="text-[11px] text-slate-400">{garbage.bulkyWaste}</p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{garbage.platformStatus}</span>
        </div>
      </div>
    </div>
  );
};
