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
  Filter,
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

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'my') return t.apartment === profile.apartment;
    if (filter === 'active') return t.status !== 'completed';
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
        return { label: 'Отклонено', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Header & New ticket CTA */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Заявки в УК и аварии</h2>
          <p className="text-xs text-slate-400">Трекинг исполнения и поддержка обращений соседей</p>
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
            return (
              <div
                key={ticket.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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

                {/* Bottom actions: Upvote & Contend buttons */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      От кв. {ticket.apartment} ({ticket.authorName})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
    </div>
  );
};
