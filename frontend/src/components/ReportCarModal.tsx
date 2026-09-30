import React, { useState } from 'react';
import { X, Car, AlertOctagon, Camera, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface ReportCarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportCarModal: React.FC<ReportCarModalProps> = ({ isOpen, onClose }) => {
  const [carNumber, setCarNumber] = useState('');
  const [issueType, setIssueType] = useState('blocked_exit');
  const [location, setLocation] = useState('Двор у 2 подъезда');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  if (!isOpen) return null;

  const issues = [
    { id: 'blocked_exit', label: 'Перекрыл выезд / ворота' },
    { id: 'blocked_garbage', label: 'Заблокировал мусоровоз' },
    { id: 'sidewalk_lawn', label: 'Стоит на тротуаре или газоне' },
    { id: 'reserved_spot', label: 'Занял чужое паркоместо' },
    { id: 'alarm_ringing', label: 'Непрерывно орет сигнализация' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carNumber.trim()) {
      toast.error('Укажите госномер автомобиля');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.reportCar({
        carNumber: carNumber.trim(),
        issueType,
        location,
        description,
      });

      toast.success(`Жалоба зарегистрирована`, {
        description: res.message || `Владелец ${carNumber.toUpperCase()} получил срочное push-уведомление в MAX.`,
      });

      setCarNumber('');
      setDescription('');
      onClose();
    } catch {
      toast.error('Ошибка отправки репорта');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-emil-in">
      <div className="w-full max-w-md bg-[#121624] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-sheet-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Жалоба на парковку</h2>
              <p className="text-xs text-slate-400">Вежливое оповещение водителя без конфликта</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3.5">
          {/* Car number input with Russian plate styling */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Госномер автомобиля
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="А 123 ВС 777"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono font-semibold tracking-wider text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 uppercase transition-colors"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasPhoto(!hasPhoto);
                  toast.info(hasPhoto ? 'Фото удалено' : 'Фото прикреплено к репорту');
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  hasPhoto
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Прикрепить фото нарушения"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Issue Types */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Характер нарушения
            </label>
            <div className="space-y-1.5">
              {issues.map((iss) => (
                <button
                  key={iss.id}
                  type="button"
                  onClick={() => setIssueType(iss.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                    issueType === iss.id
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-medium'
                      : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{iss.label}</span>
                  {issueType === iss.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Где стоит автомобиль
            </label>
            <input
              type="text"
              placeholder="Например: около въездных ворот №2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Отправка...' : 'Отправить уведомление водителю'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
