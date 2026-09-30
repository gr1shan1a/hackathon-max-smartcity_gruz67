import React, { useState } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Droplets,
  Zap,
  KeyRound,
  Bell,
  BellRing,
  HelpCircle,
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Bill, MeterReading, UserProfile } from '../types';
import { api } from '../lib/api';

interface BillsViewProps {
  bills: Bill[];
  meters: MeterReading[];
  profile: UserProfile;
  onOpenMeters: () => void;
  onBillsUpdated: (bills: Bill[]) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  meters,
  profile,
  onOpenMeters,
  onBillsUpdated,
}) => {
  const [activeBillId, setActiveBillId] = useState<string>(bills[0]?.id || '');
  const [isPaying, setIsPaying] = useState(false);
  const [remindActive, setRemindActive] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(false);

  const currentBill = bills.find((b) => b.id === activeBillId) || bills[0];

  const handlePay = async (billId: string) => {
    setIsPaying(true);
    try {
      await api.payBill(billId);

      // Emil Kowalski celebration micro-interaction: subtle confetti explosion
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981'],
      });

      toast.success('Оплата успешно проведена', {
        description: 'Электронный чек сформирован и отправлен в чат-бот MAX.',
      });

      const updated = bills.map((b) =>
        b.id === billId ? { ...b, status: 'paid' as const, paidAmount: b.totalAmount } : b
      );
      onBillsUpdated(updated);
    } catch {
      toast.error('Ошибка оплаты');
    } finally {
      setIsPaying(false);
    }
  };

  const toggleReminder = () => {
    setRemindActive(!remindActive);
    toast.info(
      !remindActive
        ? 'Уведомление включено: MAX-бот напомнит за 3 дня до расчетного числа'
        : 'Уведомления об оплате ЖКУ отключены'
    );
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Квитанции и счётчики</h2>
        <p className="text-xs text-slate-400">Платежи за квартиру и показания приборов учёта</p>
      </div>

      {/* 1. Main Bill Card */}
      {currentBill && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#161c2e] to-[#0f1422] border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Квитанция за {currentBill.period}</h3>
                <p className="text-xs text-slate-400 font-mono">ЛС: {profile.accountNumber}</p>
              </div>
            </div>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                currentBill.status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
            >
              {currentBill.status === 'paid' ? 'Оплачено' : 'К оплате'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Сумма к оплате</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                {currentBill.totalAmount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Срок оплаты</span>
              <p className="text-white font-medium">{currentBill.dueDate}</p>
            </div>
          </div>

          {/* Pay Button / Receipt info */}
          {currentBill.status !== 'paid' ? (
            <button
              onClick={() => handlePay(currentBill.id)}
              disabled={isPaying}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isPaying ? 'Обработка платежа...' : 'Оплатить через СБП в 1 клик'}</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Оплачено полностью. Задолженности нет.</span>
              </div>
              <button
                onClick={() => toast.info('Электронный чек отправлен в чат-бот MAX')}
                className="text-[11px] font-semibold underline text-emerald-400 cursor-pointer"
              >
                Чек
              </button>
            </div>
          )}

          {/* Remind me Toggle */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              {remindActive ? (
                <BellRing className="w-4 h-4 text-purple-400" />
              ) : (
                <Bell className="w-4 h-4 text-slate-500" />
              )}
              <span>Напоминание о долге в MAX</span>
            </div>
            <button
              type="button"
              onClick={toggleReminder}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                remindActive ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  remindActive ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </div>

          {/* Collapsible Itemized Breakdown */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowItemDetails(!showItemDetails)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
            >
              <span className="font-medium">Детализация начислений</span>
              {showItemDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showItemDetails && (
              <div className="mt-2 space-y-1.5 text-xs">
                {currentBill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 border-b border-white/[0.03] text-slate-300"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate">{item.name}</p>
                      {item.volume && item.rate && (
                        <p className="text-[10px] text-slate-500">
                          {item.volume} {item.unit} × {item.rate} ₽
                        </p>
                      )}
                    </div>
                    <span className="font-medium text-white shrink-0">
                      {item.amount.toFixed(2)} ₽
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Meters Card */}
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Приборы учета (Счетчики)</h3>
              <p className="text-[11px] text-slate-400">Прием показаний до 25 числа</p>
            </div>
          </div>
          <button
            onClick={onOpenMeters}
            className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Инструкция</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate">{meter.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white font-mono">
                  {meter.currentValue || meter.previousValue}
                </span>
                <span className="text-[10px] text-slate-500">{meter.unit}</span>
              </div>
              <span className="text-[9px] text-slate-500 block">Поверка до {meter.lastVerified}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onOpenMeters}
          className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Ввести свежие показания
        </button>
      </div>

    </div>
  );
};
