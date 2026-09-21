import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle2, AlertCircle, Droplets, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { MeterReading } from '../types';
import { api } from '../lib/api';

interface MeterManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  meters: MeterReading[];
  onMetersUpdated: () => void;
}

export const MeterManualModal: React.FC<MeterManualModalProps> = ({
  isOpen,
  onClose,
  meters,
  onMetersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'submit'>('submit');
  const [inputValues, setInputValues] = useState<{ [id: string]: string }>(() => {
    const initial: { [id: string]: string } = {};
    meters.forEach((m) => {
      initial[m.id] = m.currentValue ? String(m.currentValue) : '';
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleValueChange = (id: string, val: string) => {
    setInputValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      for (const meter of meters) {
        const val = parseFloat(inputValues[meter.id]);
        if (!isNaN(val) && val > 0) {
          if (val < meter.previousValue) {
            toast.error(`Ошибка для "${meter.name}": показания не могут быть меньше предыдущих (${meter.previousValue})`);
            setIsSubmitting(false);
            return;
          }
          await api.submitMeter(meter.id, val);
        }
      }

      toast.success('Показания приборов учета успешно переданы', {
        description: 'Расчет за текущий расчетный период обновлен в едином платежном документе.',
      });
      onMetersUpdated();
      onClose();
    } catch {
      toast.error('Не удалось сохранить показания');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-emil-in">
      <div className="w-full max-w-lg bg-[#121624] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-sheet-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Показания счетчиков</h2>
              <p className="text-xs text-slate-400">Передача данных и руководство по списанию</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 my-3 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'submit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ввод показаний
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Памятка / Как списывать</span>
          </button>
        </div>

        {activeTab === 'submit' ? (
          <form onSubmit={handleSubmit} className="overflow-y-auto space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200">
              Показания принимаются с 15 по 25 число каждого месяца. Расчет формируется автоматически по утвержденным тарифам региона.
            </div>

            {meters.map((meter) => (
              <div
                key={meter.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {meter.type.includes('water') ? (
                      <Droplets className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-semibold text-white">{meter.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">№ {meter.serialNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Предыдущее</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {meter.previousValue} {meter.unit}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-indigo-300 block mb-1">Текущее показание</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={String(meter.previousValue)}
                      value={inputValues[meter.id] || ''}
                      onChange={(e) => handleValueChange(meter.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Отправка данных...' : 'Передать показания в УК'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-y-auto space-y-3.5 text-xs text-slate-300">
            {/* Rule 1: Water meters */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                Счетчики горячей и холодной воды (ХВС / ГВС)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                На табло счетчика воды обычно 8 цифр: первые 5 черные, последние 3 красные.
              </p>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200">
                👉 <strong>Главное правило:</strong> Списываются только <strong>черные цифры до запятой</strong> (целые м³). Красные цифры (литры) округлять или передавать не нужно.
              </div>
            </div>

            {/* Rule 2: Electricity */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Двухтарифный электросчетчик (Т1 и Т2)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Электронные счетчики поочередно выводят показания с интервалом в несколько секунд:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                <li><strong>Т1 (Дневная зона):</strong> 07:00 — 23:00</li>
                <li><strong>Т2 (Ночная зона):</strong> 23:00 — 07:00 (льготный тариф)</li>
              </ul>
            </div>

            {/* Rule 3: Inspection seal */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                Проверка пломбы и даты поверки
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Обратите внимание на пластиковую пломбу: проволока должна быть целой без механических повреждений. Дата очередной поверки указана в квитанции ЖКУ.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('submit')}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Понятно, перейти к заполнению</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
