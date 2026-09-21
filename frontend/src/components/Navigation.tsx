import { House, LayoutGrid, Wrench, UserRound } from 'lucide-react';
export type NavTab = 'dashboard' | 'services' | 'tickets' | 'bills' | 'parking' | 'meetings' | 'community' | 'directory' | 'marketplace' | 'profile';
interface Props { currentTab: NavTab; onSelectTab: (tab: NavTab) => void; openTicketsCount?: number; pendingBillsCount?: number }
export function Navigation({ currentTab, onSelectTab }: Props) {
  const selected = ['dashboard', 'tickets', 'profile'].includes(currentTab) ? currentTab : 'services';
  const tabs = [
    { id: 'dashboard', label: 'Главная', icon: House },
    { id: 'services', label: 'Сервисы', icon: LayoutGrid },
    { id: 'tickets', label: 'Заявки', icon: Wrench },
    { id: 'profile', label: 'Профиль', icon: UserRound },
  ] as const;
  return <nav aria-label="Основная навигация" className="bottom-nav">
    <div className="mx-auto grid max-w-xl grid-cols-4">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-current={selected === id ? 'page' : undefined} onClick={() => onSelectTab(id)} className={`nav-item ${selected === id ? 'is-active' : ''}`}>
        <span className="nav-icon"><Icon size={21} strokeWidth={selected === id ? 2.2 : 1.7} /></span>
        <span>{label}</span>
      </button>)}
    </div>
  </nav>;
}
