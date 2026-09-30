import React from 'react';
import { X, AlertTriangle, Droplet, Zap, Flame, ArrowUpCircle, Clock, MapPin } from 'lucide-react';
import { Outage } from '../types';

interface OutageModalProps {
  outages: Outage[];
  isOpen: boolean;
  onClose: () => void;
}

export const OutageModal: React.FC<OutageModalProps> = ({ outages, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: Outage['type']) => {
    switch (type) {
      case 'water':
        return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'electricity':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'heating':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'elevator':
        return <ArrowUpCircle className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-emil-in">
      <div className="w-full max-w-lg bg-[#111624] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-sheet-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Аварии и плановые отключения</h2>
              <p className="text-xs text-slate-400">Оперативная информация от диспетчера ЖКХ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto py-3 space-y-3">
          {outages.map((outage) => (
            <div
              key={outage.id}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/5">{getTypeIcon(outage.type)}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{outage.title}</h3>
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md mt-0.5 ${
                        outage.status === 'active'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {outage.status === 'active' ? 'Текущее отключение' : 'Запланировано'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{outage.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-400 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{outage.period}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{outage.affected}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
