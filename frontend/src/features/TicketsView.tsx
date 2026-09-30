import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  XCircle,
  Settings,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Ticket, UserProfile } from '../types';
import { api } from '../lib/api';

interface TicketsViewProps {
  tickets: Ticket[];
  profile: UserProfile;
  onOpenNewTicket: () => void;
  onTicketsUpdated: (tickets: Ticket[]) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  profile,
  onOpenNewTicket,
  onTicketsUpdated,
}) => {
  const [filter, setFilter] = useState<'all' | 'my' | 'active' | 'completed'>('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  // Edit ticket modal state (for resident owner)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<Ticket['category']>('other');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Manager status modal state
  const [statusTicket, setStatusTicket] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<Ticket['status']>('in_progress');
  const [masterName, setMasterName] = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [masterComment, setMasterComment] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Cancelling ticket state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isManager = profile.role === 'manager';

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'my') return t.apartment === profile.apartment;
    if (filter === 'active') return t.status !== 'completed' && t.status !== 'rejected';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleVote = async (ticket: Ticket, type: 'up' | 'down') => {
    setVotingId(ticket.id);
    try {
      const updated = await api.voteTicket(ticket.id, type);
      const newTickets = tickets.map((t) => (t.id === ticket.id ? updated : t));
      onTicketsUpdated(newTickets);
      toast.success(
        type === 'up'
          ? 'Вы подтвердили проблему: коллективный приоритет повышен'
          : 'Вы опровергли актуальность проблемы'
      );
    } catch {
      toast.error('Не удалось изменить голос');
    } finally {
      setVotingId(null);
    }
  };

  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditTitle(ticket.title);
    setEditDesc(ticket.description);
    setEditCategory(ticket.category);
    setEditIsPublic(ticket.isPublic);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    if (!editTitle.trim()) {
      toast.error('Введите заголовок заявки');
      return;
    }
    if (!editDesc.trim()) {
      toast.error('Введите описание проблемы');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const updated = await api.updateTicket(editingTicket.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        isPublic: editIsPublic,
      });
      onTicketsUpdated(tickets.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Заявка успешно обновлена');
      setEditingTicket(null);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка обновления заявки');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCancelTicket = async (ticket: Ticket) => {
    if (!window.confirm(`Вы уверены, что хотите отозвать заявку ${ticket.id}?`)) {
      return;
    }

    setCancellingId(ticket.id);
    try {
      const updated = await api.cancelTicket(ticket.id);
      onTicketsUpdated(tickets.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Заявка успешно отозвана');
    } catch (err: any) {
      toast.error(err.message || 'Не удалось отозвать заявку');
    } finally {
      setCancellingId(null);
    }
  };

  const openStatusModal = (ticket: Ticket) => {
    setStatusTicket(ticket);
    setNewStatus(ticket.status);
    setMasterName(ticket.assignedTo?.name || (ticket.status === 'new' ? 'Иванов С. М.' : ''));
    setMasterPhone(ticket.assignedTo?.phone || (ticket.status === 'new' ? '+7 (999) 450-20-11' : ''));
    setMasterComment(ticket.masterComment || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTicket) return;

    setIsSubmittingStatus(true);
    try {
      const assignedTo =
        masterName.trim()
          ? {
              name: masterName.trim(),
              phone: masterPhone.trim() || '+7 (495) 123-45-67',
              role: 'Мастер УК',
            }
          : undefined;

      const updated = await api.updateTicketStatus(statusTicket.id, {
        status: newStatus,
        masterComment: masterComment.trim() || undefined,
        assignedTo,
      });

      onTicketsUpdated(tickets.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`Статус заявки обновлен: ${getStatusBadge(newStatus).label}`);
      setStatusTicket(null);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка изменения статуса');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'new':
        return { label: 'Новая', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'assigned':
        return { label: 'Назначен мастер', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'in_progress':
        return { label: 'В работе', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'completed':
        return { label: 'Выполнено', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Отклонено / Отозвано', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Header & New ticket CTA */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Заявки в УК</h2>
          <p className="text-xs text-slate-400">Трекинг исполнения, работы мастеров и поддержка соседей</p>
        </div>
        <button
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Подать заявку</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Все заявки' },
          { id: 'my', label: `Мои (${tickets.filter((t) => t.apartment === profile.apartment).length})` },
          { id: 'active', label: 'В работе' },
          { id: 'completed', label: 'Выполненные' },
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

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Wrench className="w-8 h-8 mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-400">В этой категории нет обращений</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const statusInfo = getStatusBadge(ticket.status);
            const isOwner = ticket.apartment === profile.apartment;
            const canOwnerEdit = isOwner && ticket.status === 'new';

            return (
              <div
                key={ticket.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-semibold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        {ticket.id}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {ticket.isPublic && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Видно всем</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{ticket.title}</h3>
                  </div>

                  <span className="text-[11px] text-slate-500 shrink-0">{ticket.createdAt}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">{ticket.description}</p>

                {/* Master comment / note if provided */}
                {ticket.masterComment && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-medium text-purple-200">Комментарий диспетчера / мастера:</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{ticket.masterComment}</p>
                    </div>
                  </div>
                )}

                {/* Assigned master if assigned */}
                {ticket.assignedTo && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white">{ticket.assignedTo.name}</p>
                        <p className="text-[10px] text-slate-400">{ticket.assignedTo.role}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${ticket.assignedTo.phone.replace(/[^0-9+]/g, '')}`}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      title="Позвонить мастеру"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Completion photo if available */}
                {ticket.completionPhoto && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Фотоотчет о выполнении:
                    </span>
                    <img
                      src={ticket.completionPhoto}
                      alt="Фото выполнения"
                      className="w-full h-32 object-cover rounded-xl border border-white/10"
                    />
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      От кв. {ticket.apartment} ({ticket.authorName})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Resident owner actions when status is 'new' */}
                    {canOwnerEdit && (
                      <>
                        <button
                          onClick={() => openEditModal(ticket)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                          title="Редактировать заявку"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Изменить</span>
                        </button>
                        <button
                          onClick={() => handleCancelTicket(ticket)}
                          disabled={cancellingId === ticket.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors text-xs cursor-pointer disabled:opacity-50"
                          title="Отозвать заявку"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Отозвать</span>
                        </button>
                      </>
                    )}

                    {/* Manager status management */}
                    {isManager && (
                      <button
                        onClick={() => openStatusModal(ticket)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors text-xs font-medium cursor-pointer"
                        title="Управление статусом и назначением мастера"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Статус</span>
                      </button>
                    )}

                    {/* Support Button (Upvote) */}
                    <button
                      onClick={() => handleVote(ticket, 'up')}
                      disabled={votingId === ticket.id}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        ticket.userVoted === 'up'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                      title="Подтвердить проблему (повысить приоритет для УК)"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{ticket.upvotes}</span>
                      <span className="hidden sm:inline">Подтверждаю</span>
                    </button>

                    {/* Disagree Button */}
                    <button
                      onClick={() => handleVote(ticket, 'down')}
                      disabled={votingId === ticket.id}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        ticket.userVoted === 'down'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Опровергнуть (уже исправлено или неактуально)"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Ticket Modal (Owner only) */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#13151b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Редактирование заявки</h3>
              <button
                onClick={() => setEditingTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Категория</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1f26] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="plumbing">Сантехника / Водоснабжение</option>
                  <option value="electric">Электрика</option>
                  <option value="elevator">Лифтовое хозяйство</option>
                  <option value="cleaning">Уборка и благоустройство</option>
                  <option value="other">Прочее</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Описание проблемы</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs text-slate-300">Публичная заявка (соседи смогут поддержать её)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/5 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Status Modal */}
      {statusTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#13151b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Управление заявкой {statusTicket.id}</h3>
                <p className="text-[11px] text-slate-400">Назначение статуса и ответственного мастера</p>
              </div>
              <button
                onClick={() => setStatusTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Статус заявки</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1c1f26] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="new">Новая</option>
                  <option value="assigned">Назначен мастер</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполнено</option>
                  <option value="rejected">Отклонено</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ФИО мастера (при назначении)</label>
                <input
                  type="text"
                  value={masterName}
                  placeholder="например, Иванов С. М."
                  onChange={(e) => setMasterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Телефон мастера</label>
                <input
                  type="text"
                  value={masterPhone}
                  placeholder="+7 (999) 000-00-00"
                  onChange={(e) => setMasterPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Комментарий мастера / диспетчера</label>
                <textarea
                  rows={2}
                  value={masterComment}
                  placeholder="Пояснение по ходу выполнения или причине отклонения..."
                  onChange={(e) => setMasterComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusTicket(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/5 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Применить статус</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
