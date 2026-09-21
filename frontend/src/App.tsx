import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Header,
  OutageModal,
  SosModal,
  NeighborMessageModal,
  ReportCarModal,
  NewTicketModal,
  MeterManualModal,
  GuestPassModal,
  Navigation,
} from './components';
import {
  Dashboard,
  TicketsView,
  BillsView,
  MeetingsView,
  CommunityView,
  DirectoryView,
  MarketplaceView,
  ProfileView,
} from './features';
import { NavTab } from './components/Navigation';
import { api, fallbackComplex, fallbackProfile, fallbackOutages } from './lib/api';
import {
  ComplexInfo,
  UserProfile,
  Outage,
  Ticket,
  Bill,
  MeterReading,
  Meeting,
  ThreadPost,
  StaffContact,
  PoliceOfficer,
  MarketplaceItem,
  ParkingPass,
} from './types';
import { ArrowLeft, X, MoreVertical } from 'lucide-react';

import { ServicesView } from './features/ServicesView';
import { ParkingView } from './features/ParkingView';
import type { GroupId, ServiceAction } from './lib/services';

export function App() {
  const [identityVersion, setIdentityVersion] = useState(0);
  return <AppContent key={identityVersion} onIdentityChanged={() => setIdentityVersion(v => v + 1)} />;
}

function AppContent({ onIdentityChanged }: { onIdentityChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [history, setHistory] = useState<NavTab[]>([]);
  const [serviceGroup, setServiceGroup] = useState<GroupId | null>(null);
  const scrollArea = useRef<HTMLElement>(null);
  const [passes, setPasses] = useState<ParkingPass[]>([]);
  const [selectedPass, setSelectedPass] = useState<ParkingPass | null>(null);
  const [isMaxShell, setIsMaxShell] = useState<boolean>(false);

  // Data states
  const [complex, setComplex] = useState<ComplexInfo>(fallbackComplex);
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile);
  const [outages, setOutages] = useState<Outage[]>(fallbackOutages);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [meters, setMeters] = useState<MeterReading[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [staff, setStaff] = useState<StaffContact[]>([]);
  const [policeOfficer, setPoliceOfficer] = useState<PoliceOfficer>({
    name: 'Семенов Артём Викторович',
    rank: 'Майор полиции, Старший участковый',
    phone: '+7 (495) 123-45-67',
    stationAddress: 'г. Москва, ул. Авиаконструктора Миля, д. 8, корп. 1',
    district: 'Участок № 12 (ЮВАО, район Выхино-Жулебино)',
    receptionHours: 'Вт, Чт: 17:00 — 19:00, Сб: 15:00 — 16:00',
  });
  const [garbage, setGarbage] = useState({
    dailyCollection: 'Ежедневно в 06:30 и 14:00 (ТКО)',
    bulkyWaste: 'Вторник и Суббота в 11:00 (Крупногабарит)',
    recycling: 'Ежедневно (синие контейнеры для пластика/стекла/бумаги)',
    platformStatus: 'Контейнерная площадка у 2 подъезда: убрана, свободно',
  });
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);

  // Modals state
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isOutagesOpen, setIsOutagesOpen] = useState(false);
  const [isNeighborMsgOpen, setIsNeighborMsgOpen] = useState(false);
  const [targetNeighborApt, setTargetNeighborApt] = useState<number | undefined>(undefined);
  const [isReportCarOpen, setIsReportCarOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isMetersOpen, setIsMetersOpen] = useState(false);
  const [isGuestPassOpen, setIsGuestPassOpen] = useState(false);

  // Initial data loading
  useEffect(() => {
    async function loadData() {
      try {
        const [c, p, o, t, b, m, mt, th, dir, mk, parking] = await Promise.all([
          api.getComplex(),
          api.getProfile(),
          api.getOutages(),
          api.getTickets(),
          api.getBills(),
          api.getMeters(),
          api.getMeetings(),
          api.getThreads(),
          api.getDirectory(),
          api.getMarketplace(),
          api.getParking(),
        ]);
        setComplex(c);
        setProfile(p);
        setOutages(o);
        setTickets(t);
        setBills(b);
        setMeters(m);
        setMeetings(mt);
        setThreads(th);
        if (dir.staff) setStaff(dir.staff);
        if (dir.policeOfficer) setPoliceOfficer(dir.policeOfficer);
        if (dir.garbage) setGarbage(dir.garbage);
        setMarketplace(mk);
        setPasses(parking.passes);
      } catch (err) {
        setLoadError('Не удалось загрузить данные. Проверьте соединение с сервером.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openNeighborMsgWithApt = (apt: number) => {
    setTargetNeighborApt(apt);
    setIsNeighborMsgOpen(true);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets([newTicket, ...tickets]);
  };

  const navigate = (tab: NavTab) => {
    if (tab !== currentTab) { setHistory(previous => [...previous, currentTab]); setCurrentTab(tab); }
  };
  const openPass = (pass: ParkingPass) => { setSelectedPass(pass); setIsGuestPassOpen(true); };
  const onAction = (action: ServiceAction) => {
    switch (action) {
      case 'new-ticket': setIsNewTicketOpen(true); break;
      case 'meters': setIsMetersOpen(true); break;
      case 'guest-pass': setSelectedPass(null); setIsGuestPassOpen(true); break;
      case 'report-car': setIsReportCarOpen(true); break;
      case 'neighbor-message': setTargetNeighborApt(undefined); setIsNeighborMsgOpen(true); break;
      case 'sos': setIsSosOpen(true); break;
      case 'outages': setIsOutagesOpen(true); break;
      default: if (action === 'services') setServiceGroup(null); navigate(action);
    }
  };
  useEffect(() => { scrollArea.current?.scrollTo({ top: 0 }); }, [currentTab, serviceGroup]);
  // Refresh time-based pass labels while the screen remains open.
  const [, refreshClock] = useState(0);
  useEffect(() => { const timer = setInterval(() => refreshClock(v => v + 1), 60000); return () => clearInterval(timer); }, []);

  if (loading || loadError) return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p role="status">{loading ? 'Загружаем данные дома…' : loadError}</p>
      {loadError && <button className="rounded-xl bg-purple-600 px-5 py-3" onClick={() => window.location.reload()}>Повторить</button>}
    </div>
  );

  const content = (
    <div className={`app-shell ${isMaxShell ? 'in-frame' : ''}`}>
      {/* If simulating MAX WebApp shell, render simulated messenger top bar */}
      {isMaxShell && (
        <div className="bg-[#151c2e] text-white px-4 py-2 flex items-center justify-between border-b border-white/10 text-xs select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaxShell(false)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <span className="font-semibold block leading-tight">MAX Дом • ЖК «Северное Сияние»</span>
              <span className="text-[10px] text-indigo-300">мини-приложение в чат-боте</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">WebApp</span>
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        complex={complex}
        profile={profile}
        hasOutages={outages.some((o) => o.status === 'active')}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenOutages={() => setIsOutagesOpen(true)}
        isMaxShell={isMaxShell}
        onToggleMaxShell={() => setIsMaxShell(!isMaxShell)}
      />

      {/* Main Feature View Container */}
      <main ref={scrollArea} className="app-content">
        <div className="mx-auto w-full max-w-xl px-4 pt-5 pb-8">
        {history.length > 0 && currentTab !== 'services' && <button className="back-link" onClick={() => { setCurrentTab(history[history.length - 1]); setHistory(h=>h.slice(0,-1)); }}><ArrowLeft size={16}/>Назад</button>}
        {currentTab === 'services' && <ServicesView group={serviceGroup} onGroup={setServiceGroup} onAction={onAction}/>}
        {currentTab === 'parking' && <ParkingView profile={profile} passes={passes} onCreate={()=>onAction('guest-pass')} onOpen={openPass}/>}
        {currentTab === 'dashboard' && (
          <Dashboard profile={profile} outages={outages} tickets={tickets} bills={bills} passes={passes}
            onAction={onAction} onPass={openPass}
            onGroup={group=>{setServiceGroup(group);navigate('services');}}/>

        )}

        {currentTab === 'tickets' && (
          <TicketsView
            tickets={tickets}
            profile={profile}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
            onTicketsUpdated={setTickets}
          />
        )}

        {currentTab === 'bills' && (
          <BillsView
            bills={bills}
            meters={meters}
            profile={profile}
            onOpenMeters={() => setIsMetersOpen(true)}
            onBillsUpdated={setBills}
          />
        )}

        {currentTab === 'meetings' && (
          <MeetingsView meetings={meetings} onMeetingsUpdated={setMeetings} />
        )}

        {currentTab === 'community' && (
          <CommunityView
            threads={threads}
            profile={profile}
            onOpenNeighborMsg={() => {
              setTargetNeighborApt(undefined);
              setIsNeighborMsgOpen(true);
            }}
            onThreadsUpdated={setThreads}
          />
        )}

        {currentTab === 'directory' && (
          <DirectoryView staff={staff} policeOfficer={policeOfficer} garbage={garbage} />
        )}

        {currentTab === 'marketplace' && (
          <MarketplaceView
            items={marketplace}
            profile={profile}
            onItemsUpdated={setMarketplace}
            onOpenNeighborMsgWithApt={openNeighborMsgWithApt}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            profile={profile}
            complex={complex}
            isMaxShell={isMaxShell}
            onToggleMaxShell={() => setIsMaxShell(!isMaxShell)}
            onProfileChanged={onIdentityChanged}
          />
        )}
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={tab => { setHistory([]); setServiceGroup(null); setCurrentTab(tab); }}
      />

      {/* Modals & Drawers */}
      <OutageModal
        outages={outages}
        isOpen={isOutagesOpen}
        onClose={() => setIsOutagesOpen(false)}
      />

      <SosModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />

      <NeighborMessageModal
        isOpen={isNeighborMsgOpen}
        onClose={() => setIsNeighborMsgOpen(false)}
        defaultApartment={targetNeighborApt}
      />

      <ReportCarModal
        isOpen={isReportCarOpen}
        onClose={() => setIsReportCarOpen(false)}
      />

      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <MeterManualModal
        isOpen={isMetersOpen}
        onClose={() => setIsMetersOpen(false)}
        meters={meters}
        onMetersUpdated={async () => {
          const fresh = await api.getMeters();
          setMeters(fresh);
        }}
      />

      <GuestPassModal
        isOpen={isGuestPassOpen}
        onClose={() => setIsGuestPassOpen(false)}
        spotNumber={profile.parkingSpot}
        pass={selectedPass}
        onPassCreated={pass => setPasses(previous=>[pass, ...previous])}
        onPassUpdated={pass => { setPasses(previous=>previous.map(p=>p.id===pass.id?pass:p)); setSelectedPass(pass); }}
        onViewPasses={() => { setIsGuestPassOpen(false); navigate('parking'); }}
      />

      {/* Emil Kowalski Toaster notification stack */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#121624',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          },
        }}
        richColors
      />
    </div>
  );

  // If MAX Shell simulator is active, wrap in realistic smartphone frame
  if (isMaxShell) {
    return (
      <div className="min-h-screen bg-[#070a12] p-2 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-[420px] h-[860px] max-h-[95vh] rounded-[42px] border-[8px] border-[#222838] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative bg-[#0b0f19]">
          {/* Phone speaker / camera dynamic notch */}
          <div className="w-32 h-4 bg-[#222838] rounded-b-2xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
            <div className="w-10 h-1 rounded-full bg-slate-700/60" />
          </div>
          <div className="flex-1 min-h-0 pt-2">{content}</div>
        </div>
      </div>
    );
  }

  return content;
}
