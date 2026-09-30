import { Search, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';
import { services, serviceGroups } from '../lib/services';
import type { GroupId, ServiceAction } from '../lib/services';
export function ServicesView({ group, onGroup, onAction }: { group: GroupId | null; onGroup: (id: GroupId | null) => void; onAction: (action: ServiceAction) => void }) {
  const [query, setQuery] = useState('');
  const active = serviceGroups.find(g => g.id === group);
  const normalized = query.toLowerCase().replaceAll('ё', 'е').trim();
  const found = services.filter(s => normalized ? `${s.title} ${s.description} ${s.keywords}`.toLowerCase().replaceAll('ё', 'е').includes(normalized) : s.group === group);
  return <div className="space-y-5 animate-emil-in">
    <div>
      {active && !query && <button className="back-link" onClick={() => onGroup(null)}><ArrowLeft size={16}/>Все сервисы</button>}
      <h2 className="page-title">{query ? 'Поиск по сервисам' : active?.title || 'Сервисы'}</h2>
      <p className="page-subtitle">{active && !query ? active.subtitle : 'Всё для жизни в вашем доме'}</p>
    </div>
    <div className="search-field"><Search size={19} className="shrink-0 text-slate-500"/><input aria-label="Найти сервис" placeholder="Счётчики, пропуска, контакты…" value={query} onChange={e=>setQuery(e.target.value)}/>{query && <button aria-label="Очистить поиск" onClick={()=>setQuery('')}><X size={18}/></button>}</div>
    {!group && !query ? <div className="grid grid-cols-2 gap-3">{serviceGroups.map(g=><button key={g.id} onClick={()=>onGroup(g.id)} className="category-tile"><span className={`service-icon ${g.tone}`}><g.icon size={23}/></span><h3>{g.title}</h3><p>{g.subtitle}</p><ChevronRight size={16} className="absolute right-3 top-4 text-slate-500"/></button>)}</div> : <div className="surface overflow-hidden">{found.map(s=><button key={s.action} onClick={()=>onAction(s.action)} className="service-row"><span className={`service-icon ${serviceGroups.find(g=>g.id===s.group)?.tone}`}><s.icon size={20}/></span><span className="min-w-0 flex-1 text-left"><span className="block text-sm font-medium text-white">{s.title}</span><span className="mt-1 block text-xs text-slate-400">{s.description}</span></span><ChevronRight size={17} className="shrink-0 text-slate-500"/></button>)}{!found.length && <div className="p-6 text-center"><p className="text-sm">Ничего не нашли</p><p className="mt-2 text-xs text-slate-400">Попробуйте «парковка», «оплата» или «сосед».</p></div>}</div>}
  </div>;
}
