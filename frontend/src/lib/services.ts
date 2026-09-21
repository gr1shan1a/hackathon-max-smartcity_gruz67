import { Receipt, Droplets, Wrench, Car, KeyRound, MessageCircle, ShoppingBag, Users, Phone, ShieldAlert, Building2, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavTab } from '../components/Navigation';
export type GroupId = 'home' | 'auto' | 'neighbors' | 'help';
export type ServiceAction = NavTab | 'new-ticket' | 'meters' | 'guest-pass' | 'report-car' | 'neighbor-message' | 'sos' | 'outages';
export const serviceGroups: { id: GroupId; title: string; subtitle: string; icon: LucideIcon; tone: string }[] = [
  { id: 'home', title: 'Дом и платежи', subtitle: 'Квитанции, счётчики, заявки', icon: Building2, tone: 'violet' },
  { id: 'auto', title: 'Автомобиль', subtitle: 'Парковка и гостевые пропуска', icon: Car, tone: 'mint' },
  { id: 'neighbors', title: 'Соседи', subtitle: 'Общение, объявления, собрания', icon: Users, tone: 'blue' },
  { id: 'help', title: 'Помощь', subtitle: 'Службы дома и важные контакты', icon: Phone, tone: 'amber' },
];
export const services: { action: ServiceAction; group: GroupId; title: string; description: string; icon: LucideIcon; keywords: string }[] = [
  { action: 'bills', group: 'home', title: 'Квитанции', description: 'Начисления и оплата ЖКУ', icon: Receipt, keywords: 'долг жкх деньги счет платеж' },
  { action: 'meters', group: 'home', title: 'Показания', description: 'Передать данные счётчиков', icon: Droplets, keywords: 'вода свет электричество счетчик' },
  { action: 'tickets', group: 'home', title: 'Заявки в УК', description: 'Обращения и ход работ', icon: Wrench, keywords: 'ремонт лифт сантехник проблема' },
  { action: 'outages', group: 'home', title: 'Отключения', description: 'Работы и аварии в доме', icon: Siren, keywords: 'авария вода отопление' },
  { action: 'parking', group: 'auto', title: 'Моя парковка', description: 'Машиноместо и все пропуска', icon: Car, keywords: 'паркинг машина автомобиль шлагбаум' },
  { action: 'guest-pass', group: 'auto', title: 'Пропуск гостю', description: 'Выбрать дату и время приезда', icon: KeyRound, keywords: 'курьер доставка въезд' },
  { action: 'report-car', group: 'auto', title: 'Мешает машина', description: 'Сообщить о перекрытом проезде', icon: Siren, keywords: 'авто жалоба парковка' },
  { action: 'community', group: 'neighbors', title: 'Лента дома', description: 'Новости и обсуждения', icon: MessageCircle, keywords: 'сообщество новости чат' },
  { action: 'marketplace', group: 'neighbors', title: 'Объявления', description: 'Вещи и услуги от соседей', icon: ShoppingBag, keywords: 'барахолка мастер купить продать бесплатно' },
  { action: 'meetings', group: 'neighbors', title: 'Собрания', description: 'Голосования и решения дома', icon: Users, keywords: 'осс кворум собрание голос' },
  { action: 'neighbor-message', group: 'neighbors', title: 'Написать соседу', description: 'Связаться по номеру квартиры', icon: MessageCircle, keywords: 'чат сообщение' },
  { action: 'directory', group: 'help', title: 'Службы и контакты', description: 'УК, мастера, участковый', icon: Phone, keywords: 'полиция мусор вывоз диспетчер расписание' },
  { action: 'sos', group: 'help', title: 'Экстренная помощь', description: 'Куда обратиться в срочной ситуации', icon: ShieldAlert, keywords: 'sos пожар скорая 112' },
];
