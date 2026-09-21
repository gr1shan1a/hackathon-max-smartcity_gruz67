import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Tag,
  Phone,
  MessageSquare,
  Gift,
  Wrench,
  Search,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { MarketplaceItem, UserProfile } from '../types';
import { api } from '../lib/api';

interface MarketplaceViewProps {
  items: MarketplaceItem[];
  profile: UserProfile;
  onItemsUpdated: (items: MarketplaceItem[]) => void;
  onOpenNeighborMsgWithApt: (apt: number) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  items,
  profile,
  onItemsUpdated,
  onOpenNeighborMsgWithApt,
}) => {
  const [filter, setFilter] = useState<'all' | 'goods' | 'services' | 'free'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'goods' | 'services' | 'free'>('goods');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = items.filter((item) => {
    if (filter === 'goods') return item.category === 'goods';
    if (filter === 'services') return item.category === 'services';
    if (filter === 'free') return item.category === 'free';
    return true;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('goods');
    setPrice('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MarketplaceItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setPrice(item.price > 0 ? String(item.price) : '');
    setDescription(item.description);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Введите название товара или услуги');
      return;
    }

    setIsSubmitting(true);
    try {
      const numPrice = category === 'free' ? 0 : parseFloat(price) || 0;

      if (editingItem) {
        // UPDATE
        const updated = await api.updateMarketplaceItem(editingItem.id, {
          title: title.trim(),
          category,
          price: numPrice,
          description: description.trim(),
        });
        onItemsUpdated(items.map((i) => (i.id === editingItem.id ? updated : i)));
        toast.success('Объявление обновлено');
      } else {
        // CREATE
        const created = await api.createMarketplaceItem({
          title: title.trim(),
          category,
          price: numPrice,
          description: description.trim(),
        });
        onItemsUpdated([created, ...items]);
        toast.success('Объявление опубликовано на доске дома');
      }

      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сохранить объявление');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await api.deleteMarketplaceItem(itemId);
      onItemsUpdated(items.filter((i) => i.id !== itemId));
      setDeleteConfirmId(null);
      toast.success('Объявление удалено');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось удалить объявление');
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Объявления соседей</h2>
          <p className="text-xs text-slate-400">Вещи, услуги и помощь рядом</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Разместить</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { id: 'all', label: 'Все' },
          { id: 'goods', label: 'Вещи' },
          { id: 'services', label: 'Услуги' },
          { id: 'free', label: 'Даром' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
              filter === tab.id
                ? 'bg-purple-600/25 border-purple-500/50 text-white shadow-sm'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const isOwner = item.apartment === profile.apartment;
          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.category === 'free'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : item.category === 'services'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {item.category === 'free' ? 'Даром' : item.category === 'services' ? 'Услуга' : 'Товар'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          title="Редактировать объявление"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Удалить объявление"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <span className="text-[11px] text-slate-500">{item.createdAt}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{item.description}</p>
                </div>

                <div className="text-base font-bold text-emerald-400 font-mono">
                  {item.priceFormatted}
                </div>
              </div>

              {/* Delete confirmation inline */}
              {deleteConfirmId === item.id ? (
                <div className="pt-2 border-t border-rose-500/20 flex items-center gap-2 bg-rose-500/5 rounded-xl p-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[11px] text-rose-300 flex-1">Удалить объявление?</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 text-[10px] cursor-pointer transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {isOwner ? (
                      <span className="text-purple-300 font-medium">Ваше объявление</span>
                    ) : (
                      `${item.authorName} (кв. ${item.apartment})`
                    )}
                  </span>

                  {!isOwner && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onOpenNeighborMsgWithApt(item.apartment)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Написать автору в MAX"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Написать</span>
                      </button>
                      <a
                        href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                        title="Позвонить"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
          <ShoppingBag className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-xs text-slate-400">В этой категории пока нет объявлений</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-emil-in">
          <div className="w-full max-w-md bg-[#121624] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-sheet-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  {editingItem ? <Pencil className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {editingItem ? 'Редактировать объявление' : 'Разместить объявление'}
                  </h3>
                  <p className="text-xs text-slate-400">Только для жителей ЖК «Северное Сияние»</p>
                </div>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto py-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Категория</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'goods', label: 'Товар' },
                    { id: 'services', label: 'Услуга' },
                    { id: 'free', label: 'Даром' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        category === c.id
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Название</label>
                <input
                  type="text"
                  placeholder="Например: Стремянка 2.5 м или Репетитор по математике"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {category !== 'free' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    placeholder="Например: 1500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Описание</label>
                <textarea
                  rows={3}
                  placeholder="Опишите состояние, этаж или подробности..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingItem ? 'Сохранение...' : 'Публикация...'
                    : editingItem ? 'Сохранить изменения' : 'Опубликовать'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
