import React from 'react';
import {
  ChevronRight,
  ArrowUpRight,
  Receipt,
  Droplets,
  KeyRound,
  Wrench,
  Bell,
  Car,
  Vote,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { UserProfile, Outage, Ticket, Bill, ParkingPass, Announcement, Poll } from '../types';
import { serviceGroups } from '../lib/services';
import type { GroupId, ServiceAction } from '../lib/services';
import { getPassStatus, formatPassDate } from '../lib/parking';

interface Props {
  profile: UserProfile;
  outages: Outage[];
  tickets: Ticket[];
  bills: Bill[];
  passes: ParkingPass[];
  announcements?: Announcement[];
  polls?: Poll[];
  onAction: (action: ServiceAction) => void;
  onGroup: (group: GroupId) => void;
  onPass: (pass: ParkingPass) => void;
}

export function Dashboard({
  profile,
  outages,
  tickets,
  bills,
  passes,
  announcements = [],
  polls = [],
  onAction,
  onGroup,
  onPass,
}: Props) {
  const total = bills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.totalAmount - b.paidAmount, 0);

  const outage = outages.find((o) => o.status === 'active');
  const activeTickets = tickets.filter(
    (t) => t.apartment === profile.apartment && t.status !== 'completed' && t.status !== 'rejected'
  );
  const nextPass = [...passes]
    .filter((p) => ['active', 'scheduled'].includes(getPassStatus(p)))
    .sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime())[0];

  const shortcuts = [
    { title: 'Квитанции', icon: Receipt, action: 'bills', tone: 'violet' },
    { title: 'Показания', icon: Droplets, action: 'meters', tone: 'blue' },
    { title: 'Пропуск', icon: KeyRound, action: 'guest-pass', tone: 'mint' },
    { title: 'Заявка', icon: Wrench, action: 'new-ticket', tone: 'amber' },
  ] as const;

  const isManager = profile.role === 'manager';
  const openManagerTickets = tickets.filter(
    (t) => t.status === 'new' || t.status === 'assigned' || t.status === 'in_progress'
  );

  const latestAnnouncement = announcements[0];
  const activePoll = polls.find((p) => p.status === 'active');

  return (
    <div className="space-y-5 animate-emil-in">
      {/* Greeting & Subtitle */}
      <div>
        <p className="text-xs text-slate-400">
          Здравствуйте, {profile.name.split(' ')[1] || profile.name} (кв. {profile.apartment})
        </p>
        <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-white">Всё начинается с дома</h2>
      </div>

      {/* Manager quick overview card */}
      {isManager && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-indigo-950/40 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-200">Панель председателя / управляющего</h4>
                <p className="text-[10px] text-slate-400">Административный контур управления домом</p>
              </div>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Manager
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onAction('tickets')}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Заявок в работе</span>
              <span className="text-lg font-bold text-white font-mono">{openManagerTickets.length}</span>
            </button>
            <button
              onClick={() => onAction('community')}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Активных опросов</span>
              <span className="text-lg font-bold text-purple-300 font-mono">
                {polls.filter((p) => p.status === 'active').length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Balance / Bill card */}
      <button onClick={() => onAction('bills')} className="balance-card w-full text-left cursor-pointer">
        <div className="flex items-center justify-between">
          <span className="text-xs text-violet-200/80">
            {total > 0 ? 'ЖКУ · к оплате' : 'ЖКУ · всё оплачено'}
          </span>
          <ArrowUpRight size={18} className="text-violet-200" />
        </div>
        <div className="mt-3 text-[30px] font-semibold tracking-tight">
          {total.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-xl text-violet-200">₽</span>
        </div>
        <div className="mt-2 text-xs text-violet-200/80">
          {total > 0 ? 'Оплатить через СБП в 1 клик' : 'Квитанции и история платежей'}
        </div>
      </button>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-4 gap-2">
        {shortcuts.map((s) => (
          <button key={s.action} className="quick-action cursor-pointer" onClick={() => onAction(s.action)}>
            <span className={`service-icon ${s.tone}`}>
              <s.icon size={22} />
            </span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Active Outage Banner */}
      {outage && (
        <button onClick={() => onAction('outages')} className="notice-row cursor-pointer">
          <Bell size={18} className="shrink-0 text-amber-300" />
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-xs font-medium text-amber-100 line-clamp-1">{outage.title}</span>
            <span className="mt-1 block text-[11px] text-slate-400">{outage.period}</span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-slate-500" />
        </button>
      )}

      {/* Latest Official Announcement Banner */}
      {latestAnnouncement && (
        <button
          onClick={() => onAction('community')}
          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-start gap-3 text-left w-full cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
            <Megaphone size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Официально
              </span>
              <span className="text-[10px] text-slate-500">{latestAnnouncement.createdAt}</span>
            </div>
            <h4 className="text-xs font-semibold text-white truncate">{latestAnnouncement.title}</h4>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{latestAnnouncement.text}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-slate-500 mt-2" />
        </button>
      )}

      {/* Active Poll Widget */}
      {activePoll && (
        <button
          onClick={() => onAction('community')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/30 to-purple-950/30 border border-blue-500/20 hover:border-blue-500/30 transition-all flex items-start gap-3 text-left w-full cursor-pointer"
        >
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Vote size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Опрос жильцов
              </span>
              <span className="text-[10px] text-slate-400">
                {activePoll.totalVotes} {activePoll.totalVotes === 1 ? 'голос' : 'голосов'}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-white truncate">{activePoll.title}</h4>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {(activePoll.userVotedOptionIds && activePoll.userVotedOptionIds.length > 0)
                ? '✓ Вы уже приняли участие'
                : 'Примите участие в голосовании дома'}
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-slate-500 mt-2" />
        </button>
      )}

      {/* Service Categories */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="section-title">Ваши сервисы</h3>
          <button className="text-xs font-medium text-violet-300 py-2 cursor-pointer" onClick={() => onAction('services')}>
            Все сервисы <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {serviceGroups.map((g) => (
            <button key={g.id} onClick={() => onGroup(g.id)} className="category-tile cursor-pointer">
              <span className={`service-icon ${g.tone}`}>
                <g.icon size={22} />
              </span>
              <h3>{g.title}</h3>
              <p>{g.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Upcoming parking pass */}
      {nextPass && (
        <button className="surface flex w-full items-center gap-3 p-4 text-left cursor-pointer" onClick={() => onPass(nextPass)}>
          <span className="service-icon mint">
            <KeyRound size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-slate-400">
              {getPassStatus(nextPass) === 'scheduled' ? 'Гость приедет' : 'Пропуск действует'}
            </span>
            <span className="mt-1 block text-sm font-semibold">{nextPass.guestCarNumber}</span>
            <span className="mt-1 block text-xs text-slate-400">{formatPassDate(nextPass.validFrom)}</span>
          </span>
          <ChevronRight size={17} className="text-slate-500" />
        </button>
      )}

      {/* Quick shortcuts list */}
      <section>
        <h3 className="section-title mb-3">Под рукой</h3>
        <div className="surface overflow-hidden">
          <button className="service-row cursor-pointer" onClick={() => onAction('parking')}>
            <Car size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-sm">Моя парковка</span>
            <span className="text-xs text-slate-400">{profile.parkingSpot.split(' ')[0]}</span>
            <ChevronRight size={16} className="text-slate-500" />
          </button>
          <button className="service-row cursor-pointer" onClick={() => onAction('tickets')}>
            <Wrench size={20} className="text-slate-400" />
            <span className="flex-1 text-left text-sm">Мои обращения</span>
            <span className="text-xs text-slate-400">
              {activeTickets.length ? `${activeTickets.length} в работе` : 'Все заявки'}
            </span>
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      </section>
    </div>
  );
}
