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
  Lock,
  ShieldCheck,
  Save,
  Plus,
  X,
  EyeOff,
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
  // Editable fields state
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [cars, setCars] = useState<string[]>(profile.registeredCars || []);
  const [newCarNumber, setNewCarNumber] = useState('');
  const [showAddCar, setShowAddCar] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    outages: profile.notifications?.outages ?? true,
    bills: profile.notifications?.bills ?? true,
    polls: profile.notifications?.polls ?? true,
    neighborMessages: profile.notifications?.neighborMessages ?? true,
    parking: profile.notifications?.parking ?? true,
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    hideApartment: profile.privacy?.hideApartment ?? false,
    hidePhone: profile.privacy?.hidePhone ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  // User switcher
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => toast.error('Не удалось загрузить список пользователей'));
  }, []);

  const handleAddCar = () => {
    const trimmed = newCarNumber.trim().toUpperCase();
    if (!trimmed) return;
    if (cars.includes(trimmed)) {
      toast.error('Этот номер уже добавлен');
      return;
    }
    setCars([...cars, trimmed]);
    setNewCarNumber('');
    setShowAddCar(false);
    toast.info(`Автомобиль ${trimmed} добавлен в список. Нажмите «Сохранить изменения».`);
  };

  const handleRemoveCar = (plate: string) => {
    setCars(cars.filter((c) => c !== plate));
    toast.info(`Автомобиль ${plate} удален. Нажмите «Сохранить изменения».`);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        phone: phone.trim(),
        email: email.trim(),
        registeredCars: cars,
        notifications,
        privacy,
      });
      onProfileChanged(updated);
      toast.success('Настройки профиля сохранены', {
        description: 'Изменения синхронизированы с базой данных PostgreSQL.',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

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
        `Переключились на: ${newProfile.name}${
          newProfile.role === 'admin' ? ' (Председатель совета МКД)' : ' (Житель)'
        }`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Не удалось сменить пользователя');
    } finally {
      setIsSwitching(false);
    }
  };

  const isAdmin = profile.role === 'admin' || profile.role === 'manager';

  return (
    <div className="space-y-4 pb-4 animate-emil-in">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Цифровой профиль жильца</h2>
        <p className="text-xs text-slate-400">Верификация в реестре собственников и пользовательские настройки</p>
      </div>

      {/* Main Profile Header Card */}
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
                  {profile.ownershipStatus || 'Собственник'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {complex.name}, дом {complex.building || 2}, кв. {profile.apartment}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              ЛС: {profile.personalAccount || profile.accountNumber}
            </p>
          </div>
        </div>
      </div>

      {/* 🔒 1. VERIFIED IMMUTABLE DATA (Read-only, confirmed via passport/Rosreestr) */}
      <div className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Подтверждённые данные собственника</span>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Защищено от изменения
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
          «Данные подтверждены паспортом РФ и выпиской ЕГРН. Используются для доступа к закрытым сервисам ЖК, автоматическому формированию пропусков и участию в официальных голосованиях ОСС.»
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 block">ФИО (по паспорту)</span>
            <span className="font-semibold text-white">{profile.name}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 block">Номер квартиры и подъезд</span>
            <span className="font-semibold text-white">
              Кв. {profile.apartment} • Подъезд {profile.entrance}, {profile.floor} этаж
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 block">Лицевой счёт ЖКУ</span>
            <span className="font-mono text-white font-medium">
              {profile.personalAccount || profile.accountNumber}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 block">Парковочное место</span>
            <span className="text-white font-medium">{profile.parkingSpot}</span>
          </div>
        </div>
      </div>

      {/* ✏️ 2. EDITABLE SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Contact info editing */}
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Контакты для связи (редактируемые)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Электронная почта для квитанций
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Vehicles list editing */}
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-purple-400" />
              Зарегистрированные автомобили
            </h3>
            <button
              type="button"
              onClick={() => setShowAddCar(!showAddCar)}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить авто</span>
            </button>
          </div>

          {showAddCar && (
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-purple-500/30 space-y-2">
              <span className="text-[11px] text-slate-300 block font-medium">Новый госномер автомобиля:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCarNumber}
                  onChange={(e) => setNewCarNumber(e.target.value)}
                  placeholder="А 123 ВС 777"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-purple-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleAddCar}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {cars.map((plate) => (
              <span
                key={plate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white font-mono font-semibold"
              >
                <span>{plate}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCar(plate)}
                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Удалить"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {cars.length === 0 && (
              <p className="text-xs text-slate-500 italic">Нет зарегистрированных автомобилей</p>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            Оповещения в чат-боте MAX
          </h3>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Аварии и экстренные отключения</span>
              <input
                type="checkbox"
                checked={notifications.outages}
                onChange={(e) => setNotifications({ ...notifications, outages: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Счета за ЖКУ и напоминания об оплате</span>
              <input
                type="checkbox"
                checked={notifications.bills}
                onChange={(e) => setNotifications({ ...notifications, bills: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Новые опросы и собрания собственников</span>
              <input
                type="checkbox"
                checked={notifications.polls}
                onChange={(e) => setNotifications({ ...notifications, polls: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Анонимные сообщения от соседей</span>
              <input
                type="checkbox"
                checked={notifications.neighborMessages}
                onChange={(e) => setNotifications({ ...notifications, neighborMessages: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Уведомления парковки и гостевых пропусков</span>
              <input
                type="checkbox"
                checked={notifications.parking}
                onChange={(e) => setNotifications({ ...notifications, parking: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-purple-400" />
            Приватность и отображение
          </h3>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Скрывать мой телефон при обращении соседей</span>
              <input
                type="checkbox"
                checked={privacy.hidePhone}
                onChange={(e) => setPrivacy({ ...privacy, hidePhone: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer">
              <span className="text-slate-300">Скрывать номер квартиры в публичных обсуждениях</span>
              <input
                type="checkbox"
                checked={privacy.hideApartment}
                onChange={(e) => setPrivacy({ ...privacy, hideApartment: e.target.checked })}
                className="accent-purple-600 cursor-pointer w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Сохранение в базе...' : 'Сохранить настройки профиля'}</span>
        </button>
      </form>

      {/* 👤 3. USER SWITCHER (Demo) */}
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
          Переключение между жильцом (Ким Дмитрий, кв. 47) и председателем совета МКД (Светлова Марина, кв. 1) для демонстрации ролевых сценариев хакатона.
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
