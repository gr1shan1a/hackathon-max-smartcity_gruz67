import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  HelpCircle,
  Eye,
  Send,
  Plus,
  UserCheck,
  ShieldAlert,
  Search,
  Megaphone,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Lock,
  Vote,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThreadPost, UserProfile, Announcement, Poll } from '../types';
import { api } from '../lib/api';

interface CommunityViewProps {
  threads: ThreadPost[];
  profile: UserProfile;
  announcements?: Announcement[];
  polls?: Poll[];
  onOpenNeighborMsg: () => void;
  onThreadsUpdated: (threads: ThreadPost[]) => void;
  onAnnouncementsUpdated?: (announcements: Announcement[]) => void;
  onPollsUpdated?: (polls: Poll[]) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  threads,
  profile,
  announcements = [],
  polls = [],
  onOpenNeighborMsg,
  onThreadsUpdated,
  onAnnouncementsUpdated,
  onPollsUpdated,
}) => {
  const [mainTab, setMainTab] = useState<'announcements' | 'polls' | 'threads'>('announcements');

  // Announcements manager modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annText, setAnnText] = useState('');
  const [annCategory, setAnnCategory] = useState<Announcement['category']>('info');
  const [annScopeType, setAnnScopeType] = useState<'complex' | 'building' | 'entrance'>('complex');
  const [annScopeId, setAnnScopeId] = useState('all');
  const [annValidUntil, setAnnValidUntil] = useState('До 15 октября 2026');
  const [annUrgent, setAnnUrgent] = useState(false);
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  // Polls voting state & manager modal
  const [pollSelections, setPollSelections] = useState<{ [pollId: string]: string[] }>({});
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollScopeType, setPollScopeType] = useState<'complex' | 'building' | 'entrance'>('complex');
  const [pollScopeId, setPollScopeId] = useState('all');
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(true);
  const [pollOptions, setPollOptions] = useState<string[]>(['Да, поддерживаю', 'Нет, против']);
  const [newOptionText, setNewOptionText] = useState('');
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  // Threads state
  const [threadFilter, setThreadFilter] = useState<'all' | 'official' | 'community_watch'>('all');
  const [commentInputs, setCommentInputs] = useState<{ [threadId: string]: string }>({});
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'community_watch' | 'official'>('community_watch');

  const isManager = profile.role === 'admin' || profile.role === 'manager';

  // --- ANNOUNCEMENT ACTIONS ---
  const openCreateAnn = () => {
    setEditingAnn(null);
    setAnnTitle('');
    setAnnText('');
    setAnnCategory('info');
    setAnnScopeType('complex');
    setAnnScopeId('all');
    setAnnValidUntil('До 15 октября 2026');
    setAnnUrgent(false);
    setIsAnnModalOpen(true);
  };

  const openEditAnn = (ann: Announcement) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title);
    setAnnText(ann.text);
    setAnnCategory(ann.category);
    setAnnScopeType(ann.scopeType);
    setAnnScopeId(ann.scopeId);
    setAnnValidUntil(ann.validUntil || '');
    setAnnUrgent(Boolean(ann.urgent));
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annText.trim()) {
      toast.error('Заполните заголовок и текст объявления');
      return;
    }
    setIsSubmittingAnn(true);
    try {
      if (editingAnn) {
        const updated = await api.updateAnnouncement(editingAnn.id, {
          title: annTitle.trim(),
          text: annText.trim(),
          category: annCategory,
          scopeType: annScopeType,
          scopeId: annScopeType === 'complex' ? 'all' : annScopeId,
          validUntil: annValidUntil,
          urgent: annUrgent,
        });
        if (onAnnouncementsUpdated) {
          onAnnouncementsUpdated(announcements.map((a) => (a.id === editingAnn.id ? updated : a)));
        }
        toast.success('Объявление обновлено');
      } else {
        const created = await api.createAnnouncement({
          title: annTitle.trim(),
          text: annText.trim(),
          category: annCategory,
          scopeType: annScopeType,
          scopeId: annScopeType === 'complex' ? 'all' : annScopeId,
          validUntil: annValidUntil,
          urgent: annUrgent,
          isOfficial: true,
        });
        if (onAnnouncementsUpdated) {
          onAnnouncementsUpdated([created, ...announcements]);
        }
        toast.success('Официальное объявление опубликовано');
      }
      setIsAnnModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сохранить объявление');
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;
    try {
      await api.deleteAnnouncement(id);
      if (onAnnouncementsUpdated) {
        onAnnouncementsUpdated(announcements.filter((a) => a.id !== id));
      }
      toast.success('Объявление удалено');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось удалить объявление');
    }
  };

  // --- POLL ACTIONS ---
  const handleVotePoll = async (pollId: string) => {
    const selected = pollSelections[pollId];
    if (!selected || selected.length === 0) {
      toast.error('Выберите вариант ответа');
      return;
    }
    setVotingPollId(pollId);
    try {
      const updated = await api.votePoll(pollId, selected);
      if (onPollsUpdated) {
        onPollsUpdated(polls.map((p) => (p.id === pollId ? updated : p)));
      }
      toast.success('Ваш голос успешно учтен в реестре голосований!');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось отправить голос');
    } finally {
      setVotingPollId(null);
    }
  };

  const togglePollOption = (poll: Poll, optionId: string) => {
    const current = pollSelections[poll.id] || [];
    if (poll.allowMultiple) {
      if (current.includes(optionId)) {
        setPollSelections({ ...pollSelections, [poll.id]: current.filter((id) => id !== optionId) });
      } else {
        setPollSelections({ ...pollSelections, [poll.id]: [...current, optionId] });
      }
    } else {
      setPollSelections({ ...pollSelections, [poll.id]: [optionId] });
    }
  };

  const handleSavePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle.trim()) {
      toast.error('Введите тему опроса');
      return;
    }
    if (pollOptions.length < 2) {
      toast.error('Добавьте минимум 2 варианта ответа');
      return;
    }
    setIsSubmittingPoll(true);
    try {
      const created = await api.createPoll({
        title: pollTitle.trim(),
        description: pollDescription.trim(),
        scopeType: pollScopeType,
        scopeId: pollScopeType === 'complex' ? 'all' : pollScopeId,
        allowMultiple: pollAllowMultiple,
        anonymous: pollAnonymous,
        options: pollOptions,
      });
      if (onPollsUpdated) {
        onPollsUpdated([created, ...polls]);
      }
      setIsPollModalOpen(false);
      setPollTitle('');
      setPollDescription('');
      setPollOptions(['Да, поддерживаю', 'Нет, против']);
      toast.success('Опрос опубликован для целевой аудитории');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось создать опрос');
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleClosePoll = async (id: string) => {
    try {
      const updated = await api.closePoll(id);
      if (onPollsUpdated) {
        onPollsUpdated(polls.map((p) => (p.id === id ? updated : p)));
      }
      toast.success('Опрос завершён');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось завершить опрос');
    }
  };

  const handleDeletePoll = async (id: string) => {
    if (!confirm('Удалить этот опрос?')) return;
    try {
      await api.deletePoll(id);
      if (onPollsUpdated) {
        onPollsUpdated(polls.filter((p) => p.id !== id));
      }
      toast.success('Опрос удален');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось удалить опрос');
    }
  };

  // --- THREAD ACTIONS ---
  const filteredThreads = threads.filter((th) => {
    if (threadFilter === 'official') return th.type === 'official';
    if (threadFilter === 'community_watch') return th.type === 'community_watch';
    return true;
  });

  const handleAddComment = async (threadId: string) => {
    const text = commentInputs[threadId]?.trim();
    if (!text) return;

    try {
      const comment = await api.addThreadComment(threadId, text);
      const updated = threads.map((th) => {
        if (th.id === threadId) {
          return {
            ...th,
            commentsCount: th.commentsCount + 1,
            comments: [...th.comments, comment],
          };
        }
        return th;
      });

      onThreadsUpdated(updated);
      setCommentInputs((prev) => ({ ...prev, [threadId]: '' }));
      toast.success('Комментарий добавлен');
    } catch {
      toast.error('Не удалось отправить комментарий');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Заполните заголовок и текст');
      return;
    }

    if (newType === 'official' && !isManager) {
      toast.error('Официальные объявления может публиковать только председатель совета МКД');
      return;
    }

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent, type: newType }),
      });
      const created = res.ok ? await res.json() : null;

      const newPost: ThreadPost = created || {
        id: `THR-${Date.now()}`,
        type: newType,
        title: newTitle,
        author: profile.name,
        authorRole: isManager ? 'Председатель совета МКД' : undefined,
        authorApartment: !isManager ? profile.apartment : undefined,
        createdAt: 'Только что',
        content: newContent,
        commentsCount: 0,
        viewsCount: 1,
        comments: [],
      };

      onThreadsUpdated([newPost, ...threads]);
      setNewTitle('');
      setNewContent('');
      setIsNewPostOpen(false);
      toast.success('Публикация создана');
    } catch {
      toast.error('Ошибка создания публикации');
    }
  };

  const getScopeBadge = (scopeType: string, scopeId: string) => {
    if (scopeType === 'entrance') {
      return {
        label: `Подъезд ${scopeId}`,
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    }
    if (scopeType === 'building') {
      return {
        label: `Дом ${scopeId}`,
        color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    return {
      label: 'Весь ЖК',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Сообщество и дом</h2>
          <p className="text-xs text-slate-400">Официальные объявления, опросы жильцов и домовые обсуждения</p>
        </div>
        <button
          onClick={onOpenNeighborMsg}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-purple-400" />
          <span>Написать соседу</span>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10">
        <button
          onClick={() => setMainTab('announcements')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mainTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Объявления ({announcements.length})</span>
        </button>

        <button
          onClick={() => setMainTab('polls')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mainTab === 'polls'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Опросы ({polls.length})</span>
        </button>

        <button
          onClick={() => setMainTab('threads')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mainTab === 'threads'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Обсуждения ({threads.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ОФИЦИАЛЬНЫЕ ОБЪЯВЛЕНИЯ                                 */}
      {/* ============================================================== */}
      {mainTab === 'announcements' && (
        <div className="space-y-3">
          {/* Action Bar for Manager */}
          {isManager && (
            <div className="flex justify-end">
              <button
                onClick={openCreateAnn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Создать объявление</span>
              </button>
            </div>
          )}

          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Megaphone className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-400">Нет актуальных объявлений для вашего адреса</p>
            </div>
          ) : (
            announcements.map((ann) => {
              const scopeInfo = getScopeBadge(ann.scopeType, ann.scopeId);
              return (
                <div
                  key={ann.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    ann.urgent
                      ? 'bg-rose-950/20 border-rose-500/30 shadow-rose-900/10'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Megaphone className="w-2.5 h-2.5" />
                          Официальное объявление
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${scopeInfo.color}`}>
                          {scopeInfo.label}
                        </span>
                        {ann.urgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Срочно
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">{ann.title}</h3>
                    </div>

                    <span className="text-[11px] text-slate-500 shrink-0">{ann.createdAt}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{ann.text}</p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">{ann.authorName}</span>
                      {ann.authorRole && <span className="text-[10px] text-slate-500">({ann.authorRole})</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {ann.validUntil && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ann.validUntil}
                        </span>
                      )}

                      {/* Manager edit/delete controls */}
                      {isManager && (
                        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                          <button
                            onClick={() => openEditAnn(ann)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Редактировать"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ОПРОСЫ ЖИЛЬЦОВ                                         */}
      {/* ============================================================== */}
      {mainTab === 'polls' && (
        <div className="space-y-3">
          {/* Action Bar for Manager */}
          {isManager && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsPollModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Создать опрос</span>
              </button>
            </div>
          )}

          {polls.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <BarChart3 className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-xs text-slate-400">Нет активных опросов для вашего адреса</p>
            </div>
          ) : (
            polls.map((poll) => {
              const scopeInfo = getScopeBadge(poll.scopeType, poll.scopeId);
              const userVoted = (poll.userVotedOptionIds && poll.userVotedOptionIds.length > 0) || false;
              const isClosed = poll.status === 'closed';
              const totalVotes = poll.totalVotes || poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
              const selectedOptions = pollSelections[poll.id] || poll.userVotedOptionIds || [];

              return (
                <div
                  key={poll.id}
                  className="p-4 rounded-3xl bg-gradient-to-br from-[#161c2e] to-[#0f1422] border border-white/10 space-y-3.5 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Vote className="w-2.5 h-2.5" />
                          Опрос жильцов
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${scopeInfo.color}`}>
                          {scopeInfo.label}
                        </span>
                        {isClosed ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                            Завершён
                          </span>
                        ) : userVoted ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Вы проголосовали
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Активен
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug">{poll.title}</h3>
                    </div>

                    <span className="text-[11px] text-slate-500 shrink-0 font-mono">{totalVotes} голосов</span>
                  </div>

                  {poll.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{poll.description}</p>
                  )}

                  {/* Options List with Interactive Selection & Progress Bars */}
                  <div className="space-y-2 pt-1">
                    {poll.options.map((opt) => {
                      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      const isOptionSelected = selectedOptions.includes(opt.id);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => !userVoted && !isClosed && togglePollOption(poll, opt.id)}
                          className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                            userVoted || isClosed
                              ? 'bg-white/[0.02] border-white/5 cursor-default'
                              : isOptionSelected
                              ? 'bg-purple-600/15 border-purple-500/50 cursor-pointer shadow-md'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] cursor-pointer'
                          }`}
                        >
                          {/* Progress fill (visible after voting or if results open) */}
                          {(userVoted || isClosed || poll.showResultsBeforeEnd) && (
                            <div
                              className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ${
                                isOptionSelected ? 'bg-purple-600/25' : 'bg-white/[0.04]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isOptionSelected
                                    ? 'border-purple-400 bg-purple-600 text-white'
                                    : 'border-white/20 bg-white/5'
                                }`}
                              >
                                {isOptionSelected && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-white font-medium">{opt.text}</span>
                            </div>

                            {(userVoted || isClosed || poll.showResultsBeforeEnd) && (
                              <div className="text-right shrink-0">
                                <span className="font-bold text-white font-mono">{percentage}%</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({opt.votes})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vote CTA if not voted */}
                  {!userVoted && !isClosed && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleVotePoll(poll.id)}
                        disabled={votingPollId === poll.id || (pollSelections[poll.id] || []).length === 0}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{votingPollId === poll.id ? 'Сохранение голоса...' : 'Подтвердить выбор'}</span>
                      </button>
                    </div>
                  )}

                  {/* Footer metadata & manager actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Автор: {poll.authorName}</span>

                    {isManager && (
                      <div className="flex items-center gap-2">
                        {!isClosed && (
                          <button
                            onClick={() => handleClosePoll(poll.id)}
                            className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                          >
                            Завершить
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ОБСУЖДЕНИЯ ДОМА (ТРЕДЫ)                                */}
      {/* ============================================================== */}
      {mainTab === 'threads' && (
        <div className="space-y-3">
          {/* Create thread button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'Все обсуждения' },
                { id: 'community_watch', label: 'Бдительный сосед' },
                { id: 'official', label: 'Совет дома' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setThreadFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                    threadFilter === tab.id
                      ? 'bg-purple-600/25 border-purple-500/50 text-white shadow-sm'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsNewPostOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать тему</span>
            </button>
          </div>

          {/* New Thread Form Modal/Card */}
          {isNewPostOpen && (
            <div className="p-4 rounded-3xl bg-[#161c2e] border border-purple-500/40 space-y-3 animate-emil-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xs font-bold text-white">Новая тема в обсуждениях</h3>
                <button
                  onClick={() => setIsNewPostOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Заголовок темы</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Кто оставил коробку у лифта на 12 этаже?"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Текст сообщения</label>
                  <textarea
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Опишите вопрос или предложение для соседей..."
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsNewPostOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                  >
                    Опубликовать
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Threads list */}
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {thread.type === 'official' ? 'Официально' : 'Соседский дозор'}
                    </span>
                    <h3 className="text-sm font-semibold text-white leading-snug">{thread.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">{thread.createdAt}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{thread.content}</p>

                {/* Author info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span>{thread.author}</span>
                    {thread.authorApartment && <span>(кв. {thread.authorApartment})</span>}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {thread.viewsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {thread.commentsCount}
                    </span>
                  </div>
                </div>

                {/* Comments section */}
                {thread.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {thread.comments.map((comment) => (
                      <div key={comment.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-medium text-slate-300">{comment.author}</span>
                          <span>{comment.createdAt}</span>
                        </div>
                        <p className="text-slate-300">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[thread.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [thread.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(thread.id)}
                    placeholder="Написать комментарий..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleAddComment(thread.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT ANNOUNCEMENT (Manager)                     */}
      {/* ============================================================== */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-emil-in">
          <div className="w-full max-w-lg bg-[#121624] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingAnn ? 'Редактировать объявление' : 'Создать официальное объявление'}
                </h3>
              </div>
              <button
                onClick={() => setIsAnnModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Заголовок объявления *</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Например: Плановое отключение воды"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Текст сообщения *</label>
                <textarea
                  rows={4}
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="Подробная информация для жильцов..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Категория</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c2236] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="water">Водоснабжение</option>
                    <option value="elevator">Лифтовое хозяйство</option>
                    <option value="cleaning">Уборка и клининг</option>
                    <option value="parking">Паркинг</option>
                    <option value="maintenance">Техобслуживание</option>
                    <option value="emergency">Аварийные работы</option>
                    <option value="info">Общая информация</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Срок актуальности</label>
                  <input
                    type="text"
                    value={annValidUntil}
                    onChange={(e) => setAnnValidUntil(e.target.value)}
                    placeholder="До 20 октября 2026"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Scope Selection */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <label className="text-slate-300 block font-semibold">Территориальный уровень (аудитория):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'entrance', label: 'Подъезд' },
                    { id: 'building', label: 'Весь дом' },
                    { id: 'complex', label: 'Весь ЖК' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAnnScopeType(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        annScopeType === s.id
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {annScopeType === 'entrance' && (
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Номер подъезда:</label>
                    <select
                      value={annScopeId}
                      onChange={(e) => setAnnScopeId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#1c2236] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="1">1 подъезд (кв. 1–48)</option>
                      <option value="2">2 подъезд (кв. 49–96)</option>
                      <option value="3">3 подъезд (кв. 97–144)</option>
                      <option value="4">4 подъезд (кв. 145–196)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Urgency */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] cursor-pointer">
                <input
                  type="checkbox"
                  checked={annUrgent}
                  onChange={(e) => setAnnUrgent(e.target.checked)}
                  className="accent-purple-600 cursor-pointer w-4 h-4"
                />
                <span className="text-slate-300">Пометить как срочное (выделение красным цветом)</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnn}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingAnn ? 'Сохранение...' : editingAnn ? 'Сохранить' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE POLL (Manager)                                   */}
      {/* ============================================================== */}
      {isPollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-emil-in">
          <div className="w-full max-w-lg bg-[#121624] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Создать опрос жителей</h3>
              </div>
              <button
                onClick={() => setIsPollModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePoll} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Тема / Вопрос голосования *</label>
                <input
                  type="text"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Например: Установка камер видеонаблюдения на этажах"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Пояснение к вопросу</label>
                <textarea
                  rows={2}
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  placeholder="Обоснование, смета, предложения совета дома..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Scope Selection */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <label className="text-slate-300 block font-semibold">Аудитория опроса:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'entrance', label: 'Подъезд' },
                    { id: 'building', label: 'Весь дом' },
                    { id: 'complex', label: 'Весь ЖК' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPollScopeType(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        pollScopeType === s.id
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {pollScopeType === 'entrance' && (
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Для жителей подъезда №:</label>
                    <select
                      value={pollScopeId}
                      onChange={(e) => setPollScopeId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#1c2236] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="1">1 подъезд</option>
                      <option value="2">2 подъезд</option>
                      <option value="3">3 подъезд</option>
                      <option value="4">4 подъезд</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-slate-300 block font-medium">Варианты ответа (минимум 2):</label>
                <div className="space-y-1.5">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500 text-xs"
                        required
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Добавить ещё вариант..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newOptionText.trim()) {
                        setPollOptions([...pollOptions, newOptionText.trim()]);
                        setNewOptionText('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
                  >
                    + Добавить
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                    className="accent-purple-600 cursor-pointer w-4 h-4"
                  />
                  <span className="text-slate-300">Разрешить выбор нескольких вариантов</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAnonymous}
                    onChange={(e) => setPollAnonymous(e.target.checked)}
                    className="accent-purple-600 cursor-pointer w-4 h-4"
                  />
                  <span className="text-slate-300">Анонимное голосование</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPollModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoll}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmittingPoll ? 'Публикация...' : 'Запустить опрос'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
