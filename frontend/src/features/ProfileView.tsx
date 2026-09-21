import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Home,
  Car,
  Shield,
  Bell,
  Sparkles,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Crown,
  Users,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, ComplexInfo } from '../types';
import { api } from '../lib/api';

interface ProfileViewProps {
  profile: UserProfile;
  complex: ComplexInfo;
  isMaxShell: boolean;
  onToggleMaxShell: () => void;
  onProfileChanged: (profile: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  complex,
  isMaxShell,
  onToggleMaxShell,
  onProfileChanged,
}) => {
  const [notifyOutages, setNotifyOutages] = useState(true);
  const [notifyTickets, setNotifyTickets] = useState(true);
  const [notifyNeighbors, setNotifyNeighbors] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => toast.error('Не удалось загрузить пользователей'));
  }, []);

  const handleSwitchUser = async (targetUser: UserProfile) => {
    if (targetUser.id === profile.id) {
      setShowUserList(false);
      return;
    }
    setIsSwitching(true);
    try {
      const newProfile = await api.switchUser(targetUser.id);
      onProfileChanged(newProfile);
      setShowUserList(false);
      toast.success(
        `Вошли как ${newProfile.name}${newProfile.role === 'admin' ? ' (Председатель совета МКД)' : ''}`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сменить пользователя');
    } finally {
      setIsSwitching(false);
    }
  };

  const isAdmin = profile.role === 'admin';

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Профиль жильца</h2>
        <p className="text-xs text-slate-400">Данные собственника, автомобили и настройки уведомлений</p>
      </div>

      {/* Main Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#161c2e] to-[#0f1422] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl text-white font-bold text-xl flex items-center justify-center shadow-lg ${
              isAdmin
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 shadow-amber-600/30'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-600/30'
            }`}
          >
            {profile.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">{profile.name}</h3>
              {isAdmin ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  Председатель совета МКД
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Собственник
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {complex.name}, кв. {profile.apartment}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">ЛС: {profile.accountNumber}</p>
          </div>
        </div>

        {/* Contact list */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span>Номер телефона:</span>
            </div>
            <span className="font-mono text-white font-medium">{profile.phone}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>Электронная почта:</span>
            </div>
            <span className="text-white font-medium">{profile.email}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 text-slate-400">
              <Home className="w-3.5 h-3.5" />
              <span>Подъезд / Этаж:</span>
            </div>
            <span className="text-white font-medium">
              Подъезд {profile.entrance}, {profile.floor} этаж
            </span>
          </div>
        </div>
      </div>

      {/* Property & Vehicles Card */}
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Имущество и автотранспорт
        </h3>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-white font-medium">
            <Car className="w-4 h-4 text-purple-400" />
            <span>Зарегистрированные автомобили:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.registeredCars.map((car, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-white font-semibold"
              >
                {car}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Крытый паркинг:</span>
            <span className="font-semibold text-emerald-400">Активно</span>
          </div>
          <p className="text-white font-mono font-medium">{profile.parkingSpot}</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Оповещения в мессенджере MAX
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
            <span className="text-slate-300">Аварии и экстренные отключения</span>
            <input
              type="checkbox"
              checked={notifyOutages}
              onChange={(e) => {
                setNotifyOutages(e.target.checked);
                toast.info(e.target.checked ? 'Включено' : 'Отключено');
              }}
              className="accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
            <span className="text-slate-300">Изменение статуса моих заявок</span>
            <input
              type="checkbox"
              checked={notifyTickets}
              onChange={(e) => {
                setNotifyTickets(e.target.checked);
                toast.info(e.target.checked ? 'Включено' : 'Отключено');
              }}
              className="accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
            <span className="text-slate-300">Сообщения от соседей по дому</span>
            <input
              type="checkbox"
              checked={notifyNeighbors}
              onChange={(e) => {
                setNotifyNeighbors(e.target.checked);
                toast.info(e.target.checked ? 'Включено' : 'Отключено');
              }}
              className="accent-purple-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 👤 User Switcher (Demo) */}
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Сменить пользователя (демо)
            </h3>
          </div>
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-medium transition-colors cursor-pointer border border-purple-500/30"
          >
            {showUserList ? 'Свернуть' : 'Выбрать'}
          </button>
        </div>

        {showUserList && (
          <div className="space-y-2 animate-emil-in">
            {users.map((u) => {
              const isCurrentUser = u.id === profile.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSwitchUser(u)}
                  disabled={isSwitching || isCurrentUser}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isCurrentUser
                      ? 'bg-purple-600/15 border-purple-500/40'
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 ${
                      u.role === 'admin'
                        ? 'bg-gradient-to-tr from-amber-600 to-yellow-500'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                    }`}
                  >
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {u.role === 'admin' ? '👑 Председатель совета МКД' : 'Собственник'} • кв. {u.apartment}
                    </p>
                  </div>
                  {isCurrentUser ? (
                    <span className="text-[10px] text-purple-300 font-medium shrink-0">Текущий</span>
                  ) : (
                    <LogIn className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Переключение между жильцом и председателем совета МКД для демонстрации ролевых возможностей. Без реальной аутентификации.
        </p>
      </div>

      {/* Platform & MAX Integration Shell Switcher */}
      <div className="p-4 rounded-3xl bg-indigo-950/30 border border-indigo-500/20 space-y-2 text-xs text-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Режим отображения MAX WebApp</span>
          </div>
          <button
            onClick={onToggleMaxShell}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
          >
            {isMaxShell ? 'Выключить рамку' : 'Включить рамку МАХ'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Включение рамки позволяет визуализировать работу мини-приложения внутри мобильного клиента мессенджера MAX для экспертов жюри.
        </p>
      </div>
    </div>
  );
};
