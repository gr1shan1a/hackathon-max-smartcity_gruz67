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
} from 'lucide-react';
import { toast } from 'sonner';
import { Meeting } from '../types';
import { api } from '../lib/api';

interface MeetingsViewProps {
  meetings: Meeting[];
  onMeetingsUpdated: (meetings: Meeting[]) => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ meetings, onMeetingsUpdated }) => {
  const [votingSlotId, setVotingSlotId] = useState<string | null>(null);
  const meeting = meetings[0];

  if (!meeting) {
    return (
      <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Users className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-xs text-slate-400">Нет активных общедомовых собраний</p>
      </div>
    );
  }

  const totalVotes = meeting.timeSlots.reduce((sum, s) => sum + s.votes, 0);

  const handleVoteSlot = async (slotId: string) => {
    setVotingSlotId(slotId);
    try {
      await api.voteMeetingSlot(meeting.id, slotId);

      const updatedSlots = meeting.timeSlots.map((s) => {
        if (s.id === slotId) return { ...s, votes: s.votes + 1 };
        if (s.id === meeting.userVotedSlotId) return { ...s, votes: Math.max(0, s.votes - 1) };
        return s;
      });

      const updatedMeeting = {
        ...meeting,
        timeSlots: updatedSlots,
        userVotedSlotId: slotId,
        selectedDateTime: updatedSlots.find((s) => s.id === slotId)?.datetime,
      };

      onMeetingsUpdated([updatedMeeting]);
      toast.success('Ваш голос за время собрания учтен!', {
        description: 'При выборе окончательной даты совет дома примет во внимание большинство голосов.',
      });
    } catch {
      toast.error('Не удалось проголосовать');
    } finally {
      setVotingSlotId(null);
    }
  };

  const handleDownloadCalendar = () => {
    // Generate .ics standard file for native calendar integration
    const startTime = '20260929T170000Z';
    const endTime = '20260929T190000Z';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MAX Smart City//OSS Meetings//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:meeting-${meeting.id}@max-smartcity.ru`,
      `DTSTAMP:${startTime}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:${meeting.description}`,
      'LOCATION:ЖК «Северное Сияние», ул. Авиаконструктора Миля, 14',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `OSS-Meeting-${meeting.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Файл события добавлен (.ics)', {
      description: 'Событие можно открыть в Apple Calendar, Google Calendar или Outlook.',
    });
  };

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Общедомовые собрания (ОСС)</h2>
        <p className="text-xs text-slate-400">Голосование за время, кворум и документы собственников</p>
      </div>

      {/* Meeting Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#141b2d] to-[#0d1220] border border-white/10 space-y-4 shadow-xl">
        {/* Status Badge & Quorum */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            ОСС №3 в 2026 году
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Кворум {meeting.quorumPercentage}% (порог 50%+1 пройден)</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug">{meeting.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">{meeting.description}</p>
          <p className="text-[11px] text-slate-400 mt-2">
            Инициатор: <strong className="text-slate-200">{meeting.initiator}</strong>
          </p>
        </div>

        {/* Time Slot Voting Section */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-semibold text-white">Голосование за удобное время</h4>
            </div>
            <span className="text-[11px] text-slate-400">Всего голосов: {totalVotes}</span>
          </div>

          <div className="space-y-2">
            {meeting.timeSlots.map((slot) => {
              const isSelected = meeting.userVotedSlotId === slot.id;
              const percentage = totalVotes > 0 ? Math.round((slot.votes / totalVotes) * 100) : 0;

              return (
                <button
                  key={slot.id}
                  onClick={() => handleVoteSlot(slot.id)}
                  disabled={votingSlotId === slot.id}
                  className={`w-full p-3 rounded-xl border text-left relative overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white font-semibold shadow-md'
                      : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Progress fill bar */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-300 -z-10 ${
                      isSelected ? 'bg-purple-600/30' : 'bg-white/[0.03]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="flex items-center justify-between text-xs relative z-10">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-500'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{slot.label}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[11px] text-slate-400">{slot.votes} чел.</span>
                      <span className="text-xs font-bold text-white">{percentage}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add to Calendar Button */}
        <button
          onClick={handleDownloadCalendar}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Добавить собрание в календарь (.ics / Apple / Google)</span>
        </button>

        {/* Attached Documents */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">
            Материалы и проекты решений
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meeting.documents.map((doc, idx) => (
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
      </div>
    </div>
  );
};
