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
  Poll,
  Announcement,
} from '../types';

const API_BASE = '/api';
const USER_KEY = 'max-smartcity-demo-user';
function selectedUser() {
  try { return localStorage.getItem(USER_KEY); } catch { return null; }
}
async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const userId = selectedUser();
  if (userId) headers.set('X-Demo-User', userId);
  return fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(15000) });
}


// Fallback seed data in case API is temporarily unavailable
export const fallbackProfile: UserProfile = {
  id: 'usr-47',
  name: 'Ким Дмитрий Алексеевич',
  phone: '+7 (916) 555-01-47',
  email: 'd.kim@example.com',
  apartment: 47,
  entrance: 2,
  floor: 5,
  accountNumber: 'ЛС-770420047',
  personalAccount: 'ЛС-770420047',
  address: 'ул. Авиаконструктора Миля, д. 14, кв. 47',
  building: 2,
  ownershipStatus: 'Собственник',
  registeredCars: ['Е777КХ 777', 'М123АВ 799'],
  parkingSpot: 'P-47 (Подземный паркинг, уровень -1)',
  hasCoveredParking: true,
  role: 'resident',
  notifications: {
    outages: true,
    bills: true,
    polls: true,
    neighborMessages: true,
    parking: true,
  },
  privacy: {
    hideApartment: false,
    hidePhone: true,
  },
};

export const fallbackComplex: ComplexInfo = {
  name: 'ЖК «Северное Сияние»',
  address: 'г. Москва, ул. Авиаконструктора Миля, д. 14',
  managementCompany: 'ООО «УК Сервис-Сити»',
  building: 2,
  entranceCount: 4,
  apartmentsCount: 196,
};

export const fallbackOutages: Outage[] = [
  {
    id: 'out-1',
    title: 'Плановое отключение горячей воды',
    type: 'water',
    service: 'Горячее водоснабжение',
    status: 'active',
    period: '22 сентября, 10:00 — 16:00',
    affected: 'Подъезды 1, 2, 3',
    description: 'Проведение плановых профилактических работ на узле ЦТП-4. Просим закрыть запорные краны.',
    updatedAt: 'Сегодня в 08:30',
  },
  {
    id: 'out-2',
    title: 'Техническое обслуживание лифтов',
    type: 'elevator',
    service: 'Лифтовое хозяйство',
    status: 'scheduled',
    period: '25 сентября, 11:00 — 13:00',
    affected: 'Подъезд 2 (грузопассажирский лифт)',
    description: 'Ежемесячное ТО лифтовых лебедок и проверка тросов безопасности.',
    updatedAt: 'Вчера в 17:00',
  },
];

export const api = {
  async getHealth() {
    try {
      const res = await apiFetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const res = await apiFetch(`${API_BASE}/profile`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiFetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить профиль');
    }
    return res.json();
  },

  async getComplex(): Promise<ComplexInfo> {
    try {
      const res = await apiFetch(`${API_BASE}/complex`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getOutages(): Promise<Outage[]> {
    try {
      const res = await apiFetch(`${API_BASE}/outages`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createOutage(payload: Partial<Outage>): Promise<Outage> {
    const res = await apiFetch(`${API_BASE}/outages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось создать оповещение об аварии');
    }
    return res.json();
  },

  async updateOutage(id: string, payload: Partial<Outage>): Promise<Outage> {
    const res = await apiFetch(`${API_BASE}/outages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить оповещение');
    }
    return res.json();
  },

  async deleteOutage(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/outages/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось удалить оповещение');
    }
  },

  async getTickets(): Promise<Ticket[]> {
    try {
      const res = await apiFetch(`${API_BASE}/tickets`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createTicket(payload: { title: string; description: string; category: string; isPublic: boolean }): Promise<Ticket> {
    try {
      const res = await apiFetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Не удалось создать заявку');
      }
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async updateTicket(id: string, payload: { title?: string; description?: string; category?: string; isPublic?: boolean }): Promise<Ticket> {
    const res = await apiFetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить заявку');
    }
    return res.json();
  },

  async cancelTicket(id: string): Promise<Ticket> {
    const res = await apiFetch(`${API_BASE}/tickets/${id}/cancel`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось отменить заявку');
    }
    return res.json();
  },

  async updateTicketStatus(id: string, payload: { status: string; masterName?: string; masterComment?: string; assignedTo?: { name: string; phone: string; role: string } }): Promise<Ticket> {
    const res = await apiFetch(`${API_BASE}/tickets/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить статус заявки');
    }
    return res.json();
  },

  async voteTicket(id: string, type: 'up' | 'down'): Promise<Ticket> {
    try {
      const res = await apiFetch(`${API_BASE}/tickets/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getBills(): Promise<Bill[]> {
    try {
      const res = await apiFetch(`${API_BASE}/bills`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async payBill(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiFetch(`${API_BASE}/bills/${id}/pay`, { method: 'POST' });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getMeters(): Promise<MeterReading[]> {
    try {
      const res = await apiFetch(`${API_BASE}/meters`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async submitMeter(meterId: string, value: number) {
    try {
      const res = await apiFetch(`${API_BASE}/meters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meterId, value }),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getParking(): Promise<{ passes: ParkingPass[]; spot: string; hasCoveredParking: boolean; registeredCars: string[] }> {
    try {
      const res = await apiFetch(`${API_BASE}/parking`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createParkingPass(payload: { guestCarNumber: string; guestName: string; validHours: number; validFrom?: string }): Promise<ParkingPass> {
    try {
      const res = await apiFetch(`${API_BASE}/parking/passes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const error = await res.json(); throw new Error(error.error || 'Не удалось создать пропуск'); }
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async cancelParkingPass(id: string): Promise<ParkingPass> {
    const res = await apiFetch(`${API_BASE}/parking/passes/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Не удалось отменить пропуск');
    return res.json();
  },

  async reportCar(payload: { carNumber: string; issueType: string; location: string; description: string }) {
    try {
      const res = await apiFetch(`${API_BASE}/parking/report-car`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await apiFetch(`${API_BASE}/meetings`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async voteMeetingSlot(id: string, slotId: string) {
    try {
      const res = await apiFetch(`${API_BASE}/meetings/${id}/vote-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createMeeting(payload: { title: string; type?: string; date: string; timeSlots?: string[]; description?: string; format?: string; quorum?: string }): Promise<Meeting> {
    const res = await apiFetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось создать собрание');
    }
    return res.json();
  },

  async sendNeighborMessage(payload: { toApartment: number; topic: string; text: string }) {
    try {
      const res = await apiFetch(`${API_BASE}/neighbors/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getThreads(): Promise<ThreadPost[]> {
    try {
      const res = await apiFetch(`${API_BASE}/threads`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async addThreadComment(threadId: string, text: string) {
    try {
      const res = await apiFetch(`${API_BASE}/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getDirectory(): Promise<{ staff: StaffContact[]; policeOfficer: PoliceOfficer; garbage: any }> {
    try {
      const res = await apiFetch(`${API_BASE}/directory`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async getMarketplace(): Promise<MarketplaceItem[]> {
    try {
      const res = await apiFetch(`${API_BASE}/marketplace`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createMarketplaceItem(payload: { title: string; category: string; price: number; description: string }): Promise<MarketplaceItem> {
    try {
      const res = await apiFetch(`${API_BASE}/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async updateMarketplaceItem(
    id: string,
    payload: { title?: string; category?: string; price?: number; description?: string; status?: 'active' | 'sold' }
  ): Promise<MarketplaceItem> {
    const res = await apiFetch(`${API_BASE}/marketplace/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка редактирования');
    }
    return res.json();
  },

  async deleteMarketplaceItem(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/marketplace/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка удаления');
    }
  },

  async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await apiFetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async switchUser(userId: string): Promise<UserProfile> {
    const res = await apiFetch(`${API_BASE}/users/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка смены пользователя');
    }
    const data = await res.json();
    try { localStorage.setItem(USER_KEY, data.profile.id); } catch { throw new Error('Разрешите хранение данных в браузере для смены пользователя'); }
    return data.profile;
  },

  async getPolls(): Promise<Poll[]> {
    try {
      const res = await apiFetch(`${API_BASE}/polls`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createPoll(payload: {
    title: string;
    description?: string;
    scopeType: string;
    scopeId: string;
    allowMultiple?: boolean;
    anonymous?: boolean;
    showResultsBeforeEnd?: boolean;
    startsAt?: string;
    endsAt?: string;
    options: string[];
  }): Promise<Poll> {
    const res = await apiFetch(`${API_BASE}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось создать опрос');
    }
    return res.json();
  },

  async votePoll(id: string, optionIds: string[]): Promise<Poll> {
    const res = await apiFetch(`${API_BASE}/polls/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось отправить голос');
    }
    return res.json();
  },

  async closePoll(id: string): Promise<Poll> {
    const res = await apiFetch(`${API_BASE}/polls/${id}/close`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось завершить опрос');
    }
    return res.json();
  },

  async deletePoll(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/polls/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось удалить опрос');
    }
  },

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await apiFetch(`${API_BASE}/announcements`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (error) { throw error instanceof Error ? error : new Error('Сервер недоступен. Попробуйте ещё раз.'); }
  },

  async createAnnouncement(payload: {
    title: string;
    text: string;
    category?: string;
    scopeType: string;
    scopeId: string;
    validUntil?: string;
    isOfficial?: boolean;
    urgent?: boolean;
  }): Promise<Announcement> {
    const res = await apiFetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось опубликовать объявление');
    }
    return res.json();
  },

  async updateAnnouncement(id: string, payload: Partial<Announcement>): Promise<Announcement> {
    const res = await apiFetch(`${API_BASE}/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось обновить объявление');
    }
    return res.json();
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось удалить объявление');
    }
  },
};

