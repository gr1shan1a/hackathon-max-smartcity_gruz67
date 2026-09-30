import { Building2, ShieldAlert } from 'lucide-react';
import type { ComplexInfo, UserProfile } from '../types';
interface Props {
  complex: ComplexInfo; profile: UserProfile; hasOutages: boolean; onOpenSos: () => void;
  onOpenOutages: () => void; isMaxShell: boolean; onToggleMaxShell: () => void;
}
export function Header({ complex, profile, onOpenSos }: Props) {
  return <header className="shrink-0 border-b border-white/[0.05] bg-[#0b0f19] px-4 py-3">
    <div className="mx-auto flex max-w-xl items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><Building2 size={21}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Мой дом <span className="ml-1.5 text-xs font-normal text-slate-400">кв. {profile.apartment}</span></p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{complex.name}</p>
      </div>
      <button onClick={onOpenSos} aria-label="Экстренная помощь SOS" className="flex min-h-11 items-center gap-1.5 rounded-2xl bg-rose-500/10 px-3 text-xs font-semibold text-rose-300"><ShieldAlert size={16}/>SOS</button>
    </div>
  </header>;
}
