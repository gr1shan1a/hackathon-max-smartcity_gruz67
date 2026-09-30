import { useState, useEffect, useRef } from 'react';
import { X, KeyRound, Share2, Copy, Check, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { ParkingPass } from '../types';
import { getPassStatus, passLabels, formatPassDate, moscowDateInput } from '../lib/parking';
interface Props { isOpen: boolean; onClose: () => void; spotNumber: string; pass?: ParkingPass | null; onPassCreated: (pass: ParkingPass) => void; onPassUpdated: (pass: ParkingPass) => void; onViewPasses: () => void }
export function GuestPassModal({ isOpen, onClose, spotNumber, pass, onPassCreated, onPassUpdated, onViewPasses }: Props) {
  const [carNumber,setCarNumber]=useState('');
  const [guestName,setGuestName]=useState('');
  const [start,setStart]=useState(()=>moscowDateInput(new Date(Date.now()+5*60000)));
  const [hours,setHours]=useState(8);
  const [busy,setBusy]=useState(false);
  const [current,setCurrent]=useState<ParkingPass|null>(pass || null);
  const [confirmCancel,setConfirmCancel]=useState(false);
  const dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(isOpen) { setCurrent(pass || null); setCarNumber('');setGuestName('');setStart(moscowDateInput(new Date(Date.now()+5*60000)));setConfirmCancel(false);setHours(8); } },[isOpen,pass]);
  useEffect(()=>{
    if(!isOpen) return;
    const previous=document.activeElement as HTMLElement|null;
    dialog.current?.focus();
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape' && !busy) onClose();
      if(event.key==='Tab') {
        const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]');
        if(!nodes?.length) return;
        const first=nodes[0], last=nodes[nodes.length-1];
        if(event.shiftKey && (document.activeElement===first || document.activeElement===dialog.current)){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',handleKey);
    return ()=>{document.removeEventListener('keydown',handleKey);previous?.focus();};
  },[isOpen,busy,onClose]);
  if(!isOpen) return null;
  const submit=async (event:React.FormEvent)=>{
    event.preventDefault();setBusy(true);
    try {
      const created=await api.createParkingPass({guestCarNumber:carNumber.trim(),guestName:guestName.trim()||'Гость',validHours:hours,validFrom:new Date(start+':00+03:00').toISOString()});
      setCurrent(created);onPassCreated(created);toast.success('Пропуск сохранён в «Моей парковке»');
    } catch(error){toast.error(error instanceof Error && error.message ? error.message:'Не удалось создать пропуск');}finally{setBusy(false);}
  };
  const shareText=current ? `Гостевой пропуск\n${current.guestName} · ${current.guestCarNumber}\nМесто: ${current.spotNumber}\nС ${formatPassDate(current.validFrom)} до ${formatPassDate(current.validUntil)} (МСК)\nКод: ${current.qrCodeText}` : '';
  const share=async(copy=false)=>{try{if(!copy && navigator.share) await navigator.share({title:'Гостевой пропуск',text:shareText});else{await navigator.clipboard.writeText(shareText);toast.success('Данные пропуска скопированы');}}catch(error){if((error as Error).name!=='AbortError')toast.error('Не удалось поделиться пропуском');}};
  const cancel=async()=>{if(!current)return;setBusy(true);try{const updated=await api.cancelParkingPass(current.id);setCurrent(updated);onPassUpdated(updated);setConfirmCancel(false);toast.success('Пропуск отменён');}catch{toast.error('Не удалось отменить пропуск');}finally{setBusy(false);}};
  const status=current?getPassStatus(current):null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="pass-title" tabIndex={-1} className="pass-sheet animate-sheet-in">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/5 p-5"><span className="service-icon mint"><KeyRound size={20}/></span><div className="flex-1"><h2 id="pass-title" className="text-base font-semibold">{current?'Гостевой пропуск':'Пригласить гостя'}</h2><p className="mt-1 text-xs text-slate-400">Парковка · {spotNumber.split(' ')[0]}</p></div><button className="icon-button" aria-label="Закрыть пропуск" disabled={busy} onClick={onClose}><X size={20}/></button></div>
      <div className="overflow-y-auto p-5">
      {!current ? <form onSubmit={submit} className="space-y-5">
        <label className="field-label">Номер автомобиля<input autoComplete="off" required maxLength={20} placeholder="А123ВС 777" value={carNumber} onChange={e=>setCarNumber(e.target.value.toUpperCase())} className="form-input font-mono"/></label>
        <label className="field-label">Кто приезжает<input maxLength={80} placeholder="Имя гостя или доставка" value={guestName} onChange={e=>setGuestName(e.target.value)} className="form-input"/></label>
        <div><label className="field-label">Дата и время приезда<input aria-label="Дата и время приезда" required type="datetime-local" min={moscowDateInput()} max={moscowDateInput(new Date(Date.now()+180*86400000))} value={start} onChange={e=>setStart(e.target.value)} className="form-input"/></label><p className="mt-2 text-[11px] text-slate-500">Московское время · можно оформить заранее</p></div>
        <fieldset><legend className="mb-2 text-xs font-medium text-slate-300">На сколько часов</legend><div className="segmented-control">{[4,8,24].map(value=><button type="button" key={value} aria-pressed={hours===value} onClick={()=>setHours(value)}>{value} ч</button>)}</div></fieldset>
        {start && <div className="rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400">Действует до <span className="text-slate-200">{formatPassDate(new Date(new Date(start+':00+03:00').getTime()+hours*3600000).toISOString())}</span><br/>После оформления появится в «Моей парковке».</div>}
        <button type="submit" disabled={busy} className="primary-button w-full"><KeyRound size={17}/>{busy?'Сохраняем…':'Создать пропуск'}</button>
      </form> : <div className="space-y-5">
        <div className="text-center"><span className={`pass-status ${status}`}>{passLabels[status!]}</span><h3 className="mt-3 font-mono text-2xl font-semibold">{current.guestCarNumber}</h3><p className="mt-1 text-sm text-slate-400">{current.guestName}</p></div>
        {['active','scheduled'].includes(status!) && <div className="mx-auto w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={current.qrCodeText} size={160} level="M" title="QR-код гостевого пропуска"/></div>}
        <dl className="space-y-3 rounded-2xl bg-white/[0.03] p-4 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-400">Место</dt><dd>{current.spotNumber}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Приезд</dt><dd>{formatPassDate(current.validFrom)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Действует до</dt><dd>{formatPassDate(current.validUntil)}</dd></div><div className="border-t border-white/5 pt-3"><dt className="text-slate-400">Код пропуска</dt><dd className="mt-2 break-all font-mono text-emerald-300 select-all">{current.qrCodeText}</dd></div></dl>
        {['active','scheduled'].includes(status!) && <div className="flex gap-2"><button className="primary-button flex-1" onClick={()=>share()}><Share2 size={17}/>Отправить гостю</button><button className="icon-button" aria-label="Скопировать пропуск" onClick={()=>share(true)}><Copy size={18}/></button></div>}
        <button onClick={onViewPasses} className="secondary-button w-full"><Check size={17}/>К моим пропускам</button>
        {['active','scheduled'].includes(status!) && (confirmCancel?<div className="rounded-xl border border-rose-500/20 p-3"><p className="mb-3 text-xs text-slate-300">Отменить этот пропуск? Восстановить его не получится.</p><div className="flex gap-2"><button className="secondary-button flex-1" onClick={()=>setConfirmCancel(false)}>Оставить</button><button disabled={busy} className="secondary-button flex-1 text-rose-300" onClick={cancel}>{busy?'Отменяем…':'Отменить'}</button></div></div>:<button className="w-full py-2 text-xs text-slate-500" onClick={()=>setConfirmCancel(true)}>Отменить пропуск</button>)}
      </div>}
      </div>
    </div>
  </div>;
}
