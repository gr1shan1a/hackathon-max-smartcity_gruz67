import React, { useState } from 'react';
import { X, Wrench, Plus, ArrowUpCircle, Droplet, Zap, Sparkles, Key, Trees, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Ticket } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('elevator');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'elevator', label: 'Лифты', icon: ArrowUpCircle },
    { id: 'plumbing', label: 'Сантехника / Вода', icon: Droplet },
    { id: 'electric', label: 'Электрика', icon: Zap },
    { id: 'cleaning', label: 'Уборка МОП', icon: Sparkles },
    { id: 'intercom', label: 'Домофон / СКД', icon: Key },
    { id: 'parking', label: 'Двор и парковка', icon: Trees },
    { id: 'other', label: 'Другое', icon: Wrench },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Заполните название и описание проблемы');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        isPublic,
      });

      toast.success(`Заявка ${created.id} принята диспетчером`, {
        description: 'Управляющая компания взяла обращение в работу.',
      });

      onTicketCreated(created);
      setTitle('');
      setDescription('');
      onClose();
    } catch {
      toast.error('Ошибка создания заявки');
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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Новая заявка в УК</h2>
              <p className="text-xs text-slate-400">Фиксация неисправности с контролем сроков</p>
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
          {/* Category Chips */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Категория проблемы
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as any)}
                    className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/25 border-purple-500/50 text-white font-medium shadow-md shadow-purple-500/10'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-[11px] truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Краткая суть проблемы
            </label>
            <input
              type="text"
              placeholder="Например: Не работает грузовой лифт"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Подробное описание и место
            </label>
            <textarea
              rows={3}
              placeholder="Подъезд 2, этаж 4. Лифт застрял, свет внутри горит..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
              required
            />
          </div>

          {/* Public / Community toggle */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {isPublic ? (
                <Eye className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-medium text-white">Общедомовая заявка</p>
                <p className="text-[11px] text-slate-400">
                  {isPublic
                    ? 'Соседи смогут подтвердить проблему и повысить её приоритет'
                    : 'Заявку увидит только управляющая компания'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPublic ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Отправка заявки...' : 'Отправить обращение в УК'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
