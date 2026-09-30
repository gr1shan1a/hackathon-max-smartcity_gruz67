import React, { useState } from 'react';
import { X, Send, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface NeighborMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApartment?: number;
}

export const NeighborMessageModal: React.FC<NeighborMessageModalProps> = ({
  isOpen,
  onClose,
  defaultApartment,
}) => {
  const [apartment, setApartment] = useState<string>(defaultApartment ? String(defaultApartment) : '');
  const [topic, setTopic] = useState('Протечка / Капли с потолка');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const topics = [
    'Протечка / Капли с потолка',
    'Шум в неположенное время',
    'Забытые ключи / вещи в тамбуре',
    'Парковка / перекрыт проезд',
    'Уточнение по ремонту',
    'Другой вопрос',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aptNum = parseInt(apartment, 10);
    if (!aptNum || isNaN(aptNum) || aptNum < 1 || aptNum > 300) {
      toast.error('Укажите корректный номер квартиры (1–196)');
      return;
    }
    if (!text.trim()) {
      toast.error('Введите текст сообщения');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.sendNeighborMessage({
        toApartment: aptNum,
        topic,
        text: text.trim(),
      });
      toast.success(`Сообщение отправлено в кв. ${aptNum}`, {
        description: res.message || 'Уведомление доставлено через MAX Messenger.',
      });
      setText('');
      onClose();
    } catch {
      toast.error('Не удалось отправить сообщение. Попробуйте еще раз.');
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Написать соседу</h2>
              <p className="text-xs text-slate-400">Приватное уведомление жильцу квартиры</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3.5">
          {/* Apartment Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Номер квартиры получателя
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                placeholder="Например: 48"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-500">кв.</span>
            </div>
          </div>

          {/* Topic Select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Тема обращения</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161c2e] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500/60 transition-colors cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Текст сообщения
            </label>
            <textarea
              rows={3}
              placeholder="Здравствуйте! Кажется, у вас в ванной подкапывает вода..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
              required
            />
          </div>

          {/* Privacy badge */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-xs text-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ваш номер телефона и ФИО защищены. Бот MAX отправит сообщение в квартиру №{apartment || '...'} с кнопкой быстрого ответа.
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Отправка...' : 'Отправить соседу в MAX'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
