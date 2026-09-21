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
} from 'lucide-react';
import { toast } from 'sonner';
import { ThreadPost, UserProfile } from '../types';
import { api } from '../lib/api';

interface CommunityViewProps {
  threads: ThreadPost[];
  profile: UserProfile;
  onOpenNeighborMsg: () => void;
  onThreadsUpdated: (threads: ThreadPost[]) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  threads,
  profile,
  onOpenNeighborMsg,
  onThreadsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'official' | 'community_watch'>('all');
  const [commentInputs, setCommentInputs] = useState<{ [threadId: string]: string }>({});
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'community_watch' | 'official'>('community_watch');

  const filteredThreads = threads.filter((th) => {
    if (activeTab === 'official') return th.type === 'official';
    if (activeTab === 'community_watch') return th.type === 'community_watch';
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

    // Only admin can post official threads
    if (newType === 'official' && profile.role !== 'admin') {
      toast.error('Официальные объявления может публиковать только председатель совета МКД');
      return;
    }

    try {
      // Post to threads API
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
        authorRole: profile.role === 'admin' ? 'Председатель совета МКД' : undefined,
        authorApartment: profile.role !== 'admin' ? profile.apartment : undefined,
        createdAt: 'Только что',
        content: newContent,
        commentsCount: 0,
        viewsCount: 1,
        comments: [],
      };

      onThreadsUpdated([newPost, ...threads]);
      toast.success('Тред опубликован в домовом сообществе');
      setNewTitle('');
      setNewContent('');
      setIsNewPostOpen(false);
    } catch {
      toast.error('Ошибка публикации');
    }
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Домовое сообщество</h2>
          <p className="text-xs text-slate-400">Официальные новости и ветка «Кто-то что-то видел»</p>
        </div>
        <button
          onClick={() => setIsNewPostOpen(!isNewPostOpen)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новый тред</span>
        </button>
      </div>

      {/* Quick Action: Message neighbor */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Связаться с жителем квартиры</h4>
            <p className="text-[11px] text-slate-400 truncate">
              Анонимно через MAX-бота без раскрытия номера телефона
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNeighborMsg}
          className="shrink-0 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Написать
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Все записи' },
          { id: 'official', label: 'Новости Совета МКД' },
          { id: 'community_watch', label: '«Кто-то что-то видел?»' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-purple-600/25 border-purple-500/50 text-white shadow-sm'
                : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Post Form Drawer */}
      {isNewPostOpen && (
        <form
          onSubmit={handleCreatePost}
          className="p-4 rounded-2xl bg-[#131929] border border-purple-500/30 space-y-3 animate-emil-in"
        >
          <h3 className="text-xs font-semibold text-white">Создать новое обсуждение</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewType('community_watch')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                newType === 'community_watch'
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              Кто-то что-то видел?
            </button>
            {profile.role === 'admin' && (
              <button
                type="button"
                onClick={() => setNewType('official')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                  newType === 'official'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                👑 Официальное
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Заголовок треда (например: Потеряны ключи во 2 подъезде)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            required
          />
          <textarea
            rows={2}
            placeholder="Опишите подробности..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewPostOpen(false)}
              className="py-1.5 px-3 rounded-xl bg-white/5 text-slate-400 text-xs"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
            >
              Опубликовать
            </button>
          </div>
        </form>
      )}

      {/* Threads List */}
      <div className="space-y-3">
        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    thread.type === 'official'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {thread.type === 'official' ? 'Официально' : 'Кто-то видел'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {thread.author} {thread.authorRole ? `(${thread.authorRole})` : `(кв. ${thread.authorApartment})`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{thread.createdAt}</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">{thread.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{thread.content}</p>
            </div>

            {/* Comments List */}
            {thread.comments.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  Комментарии ({thread.comments.length}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {thread.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                    >
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-300">{comment.author}</span>
                        <span>{comment.createdAt}</span>
                      </div>
                      <p className="text-slate-300">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Write comment input */}
            <div className="pt-1 flex gap-2">
              <input
                type="text"
                placeholder="Написать комментарий..."
                value={commentInputs[thread.id] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({ ...prev, [thread.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment(thread.id);
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => handleAddComment(thread.id)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center justify-center cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
