import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Droplets,
  Zap,
  ArrowRight,
  History,
  TrendingUp,
  Loader2,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'manual'>('submit');
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
        const valStr = inputValues[meter.id];
        if (!valStr || valStr.trim() === '') continue;

        const val = parseFloat(valStr);
        if (isNaN(val)) {
          toast.error(`Введите корректное число для "${meter.name}"`);
          setIsSubmitting(false);
          return;
        }

        if (val < meter.previousValue) {
          toast.error(
            `Ошибка для "${meter.name}": показания не могут быть меньше предыдущих (${meter.previousValue} ${meter.unit})`
          );
          setIsSubmitting(false);
          return;
        }

        await api.submitMeter(meter.id, val);
      }

      toast.success('Показания успешно переданы в УК', {
        description: 'Новые данные зафиксированы в расчетном центре и сохранены в базе.',
      });
      onMetersUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сохранить показания');
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
              <h2 className="text-base font-semibold text-white">Приборы учета (Счетчики)</h2>
              <p className="text-xs text-slate-400">Передача показаний и история расхода</p>
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
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>История</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Памятка</span>
          </button>
        </div>

        {/* Tab 1: Submit readings */}
        {activeTab === 'submit' && (
          <form onSubmit={handleSubmit} className="overflow-y-auto space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200">
              Показания принимаются с 15 по 25 число каждого месяца. Расчет формируется автоматически по утвержденным тарифам.
            </div>

            {meters.map((meter) => {
              const currentValNum = parseFloat(inputValues[meter.id] || '');
              const isValidNumber = !isNaN(currentValNum);
              const diff = isValidNumber ? currentValNum - meter.previousValue : null;
              const isInvalidDiff = diff !== null && diff < 0;

              return (
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
                      <label className="text-[10px] text-indigo-300 block mb-1">Новое значение</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={String(meter.previousValue)}
                        value={inputValues[meter.id] ?? ''}
                        onChange={(e) => handleValueChange(meter.id, e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg bg-white/[0.05] border font-mono text-xs text-white focus:outline-none transition-colors ${
                          isInvalidDiff
                            ? 'border-rose-500 focus:border-rose-400'
                            : 'border-white/20 focus:border-indigo-500'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Real-time delta feedback */}
                  {diff !== null && !isInvalidDiff && diff > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Расход за период: +{diff.toFixed(2)} {meter.unit}</span>
                    </div>
                  )}

                  {isInvalidDiff && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-400 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Показание не может быть меньше {meter.previousValue}</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Отправка данных...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Передать показания в УК</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: History of readings */}
        {activeTab === 'history' && (
          <div className="overflow-y-auto space-y-3.5 text-xs text-slate-300">
            {meters.map((meter) => (
              <div
                key={meter.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {meter.type.includes('water') ? (
                      <Droplets className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="font-semibold text-white">{meter.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">№ {meter.serialNumber}</span>
                </div>

                {meter.history && meter.history.length > 0 ? (
                  <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden">
                    {meter.history.map((entry, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between bg-white/[0.01]">
                        <span className="text-[11px] text-slate-400">{entry.date}</span>
                        <div className="text-right">
                          <span className="font-mono font-medium text-white text-xs">
                            {entry.value} {meter.unit}
                          </span>
                          <span className="text-[10px] text-emerald-400 ml-2">
                            (+{entry.consumption} {meter.unit})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs bg-white/[0.02] rounded-xl">
                    История показаний пока пуста
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Manual instructions */}
        {activeTab === 'manual' && (
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
                👉 <strong>Главное правило:</strong> Списываются только <strong>черные цифры до запятой</strong> (целые м³). Красные цифры округлять не нужно.
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
