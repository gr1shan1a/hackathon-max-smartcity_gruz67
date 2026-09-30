import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  BarChart3,
  CalendarPlus,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Meeting, UserProfile } from '../types';
import { api } from '../lib/api';

interface MeetingsViewProps {
  meetings: Meeting[];
  onMeetingsUpdated: (meetings: Meeting[]) => void;
  userProfile?: UserProfile;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  onMeetingsUpdated,
  userProfile,
}) => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(meetings[0]?.id || '');
  const [votingSlotId, setVotingSlotId] = useState<string | null>(null);

  // Manager Create Meeting Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'oss' | 'informal'>('oss');
  const [date, setDate] = useState('15 октября 2026');
  const [format, setFormat] = useState('Очно-заочное (в приложении)');
  const [quorum, setQuorum] = useState('50% + 1 голос собственников');
  const [description, setDescription] = useState('');
  const [slot1, setSlot1] = useState('15 октября 2026, 19:00');
  const [slot2, setSlot2] = useState('15 октября 2026, 20:30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isManager = userProfile?.role === 'admin' || userProfile?.role === 'manager';

  const meeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];

  const handleVoteSlot = async (mId: string, slotId: string) => {
    setVotingSlotId(slotId);
    try {
      const updated = await api.voteMeetingSlot(mId, slotId);
      const newMeetings = meetings.map((m) => (m.id === mId ? updated : m));
      onMeetingsUpdated(newMeetings);
      toast.success('Ваш голос за время собрания учтен!', {
        description: 'При выборе окончательной даты совет дома примет во внимание большинство голосов.',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось проголосовать');
    } finally {
      setVotingSlotId(null);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Укажите повестку / тему собрания');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await api.createMeeting({
        title: title.trim(),
        type,
        date,
        format,
        quorum,
        description: description.trim(),
        timeSlots: [slot1.trim(), slot2.trim()].filter(Boolean),
      });
      onMeetingsUpdated([created, ...meetings]);
      setSelectedMeetingId(created.id);
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      toast.success('Собрание собственников назначено и опубликовано в повестке');
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось создать собрание');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCalendar = (m: Meeting) => {
    const startTime = '20260929T170000Z';
    const endTime = '20260929T190000Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MAX Smart City//OSS Meetings//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:meeting-${m.id}@max-smartcity.ru`,
      `DTSTAMP:${startTime}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${m.title}`,
      `DESCRIPTION:${m.description}`,
      'LOCATION:ЖК «Северное Сияние», ул. Авиаконструктора Миля, 14',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `OSS-Meeting-${m.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Файл события добавлен (.ics)', {
      description: 'Событие можно открыть в Apple Calendar, Google Calendar или Outlook.',
    });
  };

  if (!meeting && !isManager) {
    return (
      <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-xs text-slate-400">Нет активных общедомовых собраний</p>
      </div>
    );
  }

  const totalVotes = meeting?.timeSlots ? meeting.timeSlots.reduce((sum, s) => sum + s.votes, 0) : 0;
  const isPast = meeting?.status === 'completed' || meeting?.status === 'past';

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title & Action */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Собрания и ОСС</h2>
          <p className="text-xs text-slate-400">Голосование по повестке дома и электронные протоколы</p>
        </div>
        {isManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Назначить ОСС</span>
          </button>
        )}
      </div>

      {/* Multiple Meetings Selector if more than 1 */}
      {meetings.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMeetingId(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                m.id === (meeting?.id || '')
                  ? 'bg-purple-600/25 border-purple-500/50 text-white'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {m.title.length > 30 ? m.title.slice(0, 30) + '...' : m.title}
            </button>
          ))}
        </div>
      )}

      {meeting && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#161c2e] to-[#0f1422] border border-white/10 space-y-4 shadow-xl">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {meeting.type === 'oss' ? 'Официальное ОСС' : 'Встреча жильцов'}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    isPast
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isPast ? 'Завершено' : 'Идет выбор времени'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{meeting.title}</h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{meeting.description}</p>

          {/* Quorum and Format metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">Формат проведения</span>
              <span className="font-medium text-white">{meeting.format || 'Очно-заочное'}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">Необходимый кворум</span>
              <span className="font-medium text-emerald-400">{meeting.quorum || '50% + 1 голос'}</span>
            </div>
          </div>

          {/* Time Slots Voting Section */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {isPast ? 'Выбранное время собрания:' : 'Голосование за удобное время:'}
              </span>
              <span className="text-[11px] text-slate-400">Всего голосов: {totalVotes}</span>
            </div>

            <div className="space-y-2">
              {(meeting.timeSlots || []).map((slot) => {
                const percentage = totalVotes > 0 ? Math.round((slot.votes / totalVotes) * 100) : 0;
                const isSelected = meeting.userVotedSlotId === slot.id;

                return (
                  <button
                    key={slot.id}
                    onClick={() => !isPast && handleVoteSlot(meeting.id, slot.id)}
                    disabled={isPast || votingSlotId === slot.id}
                    className={`w-full text-left p-3 rounded-2xl border transition-all relative overflow-hidden ${
                      isPast
                        ? 'bg-white/[0.02] border-white/5 cursor-default'
                        : isSelected
                        ? 'bg-purple-600/15 border-purple-500/50 cursor-pointer shadow-md'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] cursor-pointer'
                    }`}
                  >
                    {/* Background Progress Fill */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                        isSelected ? 'bg-purple-600/20' : 'bg-white/[0.03]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-purple-400 bg-purple-600 text-white'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{slot.datetime}</p>
                          {slot.label && <p className="text-[10px] text-slate-400">{slot.label}</p>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-white">{percentage}%</span>
                        <p className="text-[10px] text-slate-400 font-mono">{slot.votes} чел.</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar export CTA */}
          <button
            onClick={() => handleDownloadCalendar(meeting)}
            className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer active:scale-95"
          >
            <CalendarPlus className="w-4 h-4 text-purple-400" />
            <span>Добавить собрание в календарь (.ics / Apple / Google)</span>
          </button>

          {/* Attached Documents */}
          {(meeting.documents || []).length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">
                Материалы и проекты решений
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meeting.documents!.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info(`Открытие документа: ${doc.title}`);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manager Create Meeting Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-emil-in">
          <div className="w-full max-w-lg bg-[#121624] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Назначить собрание собственников</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Повестка / Тема собрания *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Выбор подрядчика по установке шлагбаума"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Тип собрания</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c2236] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="oss">Официальное ОСС</option>
                    <option value="informal">Встреча жильцов</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Дата проведения</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Формат собрания</label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Описание и проект решения</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробности повестки, смета и проект протокола..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-white/5">
                <label className="text-slate-300 block font-medium">Варианты времени для голосования:</label>
                <input
                  type="text"
                  value={slot1}
                  onChange={(e) => setSlot1(e.target.value)}
                  placeholder="Вариант времени 1"
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  value={slot2}
                  onChange={(e) => setSlot2(e.target.value)}
                  placeholder="Вариант времени 2"
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/15 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Публикация...' : 'Опубликовать ОСС'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
