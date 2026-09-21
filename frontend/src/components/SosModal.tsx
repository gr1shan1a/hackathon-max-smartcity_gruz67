import React, { useState } from 'react';
import { X, ShieldAlert, Phone, Flame, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose }) => {
  const [calledEmergency, setCalledEmergency] = useState(false);

  if (!isOpen) return null;

  const handleQuickDispatch = (serviceName: string) => {
    setCalledEmergency(true);
    toast.error(`Вызов передан: ${serviceName}`, {
      description: 'Дежурная бригада уведомлена, диспетчер свяжется с вами в течение 2 минут.',
      duration: 5000,
    });
    setTimeout(() => {
      setCalledEmergency(false);
      onClose();
    }, 2000);
  };

  const emergencyContacts = [
    {
      title: 'Аварийно-диспетчерская служба дома (24/7)',
      subtitle: 'Протечки, застревание в лифте, аварии электросети',
      phone: '+7 (495) 700-11-22',
      badge: 'Круглосуточно',
      color: 'from-red-600 to-rose-700',
    },
    {
      title: 'Единая служба спасения',
      subtitle: 'Пожарная охрана, скорая помощь, полиция',
      phone: '112',
      badge: 'Экстренно',
      color: 'from-amber-600 to-orange-700',
    },
    {
      title: 'Аварийная газовая служба',
      subtitle: 'При запахе газа в подъезде или квартире',
      phone: '104',
      badge: 'Опасно',
      color: 'from-yellow-600 to-amber-700',
    },
    {
      title: 'Пост охраны и консьерж 2 подъезда',
      subtitle: 'Шлагбаум, посторонние, общественный порядок',
      phone: '+7 (495) 700-11-25',
      badge: 'На объекте',
      color: 'from-slate-700 to-slate-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-emil-in">
      <div className="w-full max-w-md bg-[#121624] border border-rose-500/30 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-sheet-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Экстренная помощь (SOS)</h2>
              <p className="text-xs text-rose-300">Круглосуточные службы быстрого реагирования</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Emergency Call Buttons */}
        <div className="py-4 space-y-2.5">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-white truncate">{contact.title}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                    {contact.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{contact.subtitle}</p>
              </div>

              <a
                href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                onClick={() => handleQuickDispatch(contact.title)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-medium text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition-transform"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{contact.phone}</span>
              </a>
            </div>
          ))}
        </div>

        {/* Dispatch confirmation banner if triggered */}
        {calledEmergency && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-emil-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Сигнал тревоги передан старшему дежурному инженеру дома!</span>
          </div>
        )}

        <div className="pt-2 text-[11px] text-slate-400 text-center">
          При угрозе жизни или запахе газа незамедлительно покиньте опасную зону.
        </div>
      </div>
    </div>
  );
};
