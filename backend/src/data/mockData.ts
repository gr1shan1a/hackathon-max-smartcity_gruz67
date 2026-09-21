export interface Outage {
  id: string;
  title: string;
  type: 'water' | 'electricity' | 'heating' | 'elevator';
  status: 'active' | 'scheduled' | 'resolved';
  period: string;
  affected: string;
  description: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: 'elevator' | 'plumbing' | 'electric' | 'cleaning' | 'intercom' | 'parking' | 'other';
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  apartment: number;
  authorName: string;
  createdAt: string;
  description: string;
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  isPublic: boolean;
  assignedTo?: {
    name: string;
    role: string;
    phone: string;
  };
  completionPhoto?: string;
}

export interface Bill {
  id: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  items: {
    name: string;
    amount: number;
    unit?: string;
    volume?: number;
    rate?: number;
  }[];
}

export interface MeterReading {
  id: string;
  type: 'cold_water' | 'hot_water' | 'electricity_t1' | 'electricity_t2';
  name: string;
  serialNumber: string;
  previousValue: number;
  currentValue?: number;
  unit: string;
  lastVerified: string;
  status: 'submitted' | 'due' | 'pending';
}

export interface ParkingPass {
  id: string;
  guestCarNumber: string;
  guestName: string;
  spotNumber: string;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired';
  qrCodeText: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'oss' | 'informal';
  initiator: string;
  status: 'voting_time' | 'scheduled' | 'completed';
  quorumReached: boolean;
  quorumPercentage: number;
  description: string;
  timeSlots: {
    id: string;
    datetime: string;
    label: string;
    votes: number;
  }[];
  userVotedSlotId?: string;
  selectedDateTime?: string;
  documents: { title: string; url: string }[];
}

export interface ThreadPost {
  id: string;
  type: 'official' | 'community_watch';
  title: string;
  author: string;
  authorRole?: string;
  authorApartment?: number;
  createdAt: string;
  content: string;
  commentsCount: number;
  viewsCount: number;
  comments: {
    id: string;
    author: string;
    apartment?: number;
    text: string;
    createdAt: string;
  }[];
}

export interface StaffContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  workingHours: string;
  emergencyAvailable: boolean;
  photo?: string;
  dutyArea?: string;
}

export interface PoliceOfficer {
  name: string;
  rank: string;
  phone: string;
  stationAddress: string;
  district: string;
  receptionHours: string;
  coordinates?: { lat: number; lng: number };
}

export interface MarketplaceItem {
  id: string;
  title: string;
  category: 'goods' | 'services' | 'free';
  price: number;
  priceFormatted: string;
  apartment: number;
  authorName: string;
  phone: string;
  createdAt: string;
  description: string;
  image?: string;
}

// Mock Users Registry
export const mockUsers = [
  {
    id: 'usr-47',
    name: 'Ким Дмитрий Алексеевич',
    phone: '+7 (916) 555-01-47',
    email: 'd.kim@example.com',
    apartment: 47,
    entrance: 2,
    floor: 5,
    accountNumber: 'ЛС-770420047',
    registeredCars: ['Е777КХ 777', 'М123АВ 799'],
    parkingSpot: 'P-47 (Подземный паркинг, уровень -1)',
    hasCoveredParking: true,
    role: 'resident' as const,
  },
  {
    id: 'usr-01',
    name: 'Светлова Марина Ивановна',
    phone: '+7 (916) 100-00-01',
    email: 'm.svetlova@uk-servis.ru',
    apartment: 1,
    entrance: 1,
    floor: 1,
    accountNumber: 'ЛС-770420001',
    registeredCars: ['А001МС 777'],
    parkingSpot: 'P-01 (Подземный паркинг, уровень -1)',
    hasCoveredParking: true,
    role: 'admin' as const,
  },
];

// Initial In-Memory Seed Data
export const initialData = {
  complex: {
    name: 'ЖК «Северное Сияние»',
    address: 'г. Москва, ул. Авиаконструктора Миля, д. 14',
    managementCompany: 'ООО «УК Сервис-Сити»',
    building: 2,
    entranceCount: 4,
    apartmentsCount: 196,
  },
  userProfile: mockUsers[0],
  users: mockUsers,
  activeUserId: mockUsers[0].id,
  outages: [
    {
      id: 'out-1',
      title: 'Плановое отключение горячей воды',
      type: 'water',
      status: 'active',
      period: '22 сентября, 10:00 — 16:00',
      affected: 'Подъезды 1, 2, 3',
      description: 'Проведение плановых профилактических работ на тепловом пункте ЦТП-4. Просим закрыть запорные краны.',
      updatedAt: 'Сегодня в 08:30',
    },
    {
      id: 'out-2',
      title: 'Техническое обслуживание лифтов',
      type: 'elevator',
      status: 'scheduled',
      period: '25 сентября, 11:00 — 13:00',
      affected: 'Подъезд 2 (грузопассажирский лифт)',
      description: 'Ежемесячное ТО лифтовых лебедок и проверка тросов безопасности.',
      updatedAt: 'Вчера в 17:00',
    },
  ] as Outage[],
  tickets: [
    {
      id: 'TCK-142',
      title: 'Застрял грузовой лифт во 2 подъезде',
      category: 'elevator',
      status: 'in_progress',
      apartment: 38,
      authorName: 'Михаил Д.',
      createdAt: 'Сегодня в 10:15',
      description: 'Лифт встал на 4 этаже, свет горит, двери заблокированы. Людей внутри нет.',
      upvotes: 19,
      downvotes: 1,
      userVoted: 'up',
      isPublic: true,
      assignedTo: {
        name: 'Александр Семёнов',
        role: 'Лифтер-электромеханик',
        phone: '+7 (926) 333-11-25',
      },
    },
    {
      id: 'TCK-140',
      title: 'Перегорела светодиодная лампа на 5 этаже',
      category: 'electric',
      status: 'completed',
      apartment: 42,
      authorName: 'Алексей Соколов',
      createdAt: '19 сен 2026',
      description: 'Темно перед дверью в общий тамбур, не видно замочную скважину.',
      upvotes: 4,
      downvotes: 0,
      userVoted: 'up',
      isPublic: true,
      assignedTo: {
        name: 'Сергей Николаев',
        role: 'Дежурный электрик',
        phone: '+7 (926) 333-11-23',
      },
      completionPhoto: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'TCK-139',
      title: 'Отрегулировать доводчик входной двери подъезда',
      category: 'intercom',
      status: 'assigned',
      apartment: 12,
      authorName: 'Екатерина В.',
      createdAt: '18 сен 2026',
      description: 'Дверь сильно хлопает по ночам, доводчик не притормаживает в конце.',
      upvotes: 8,
      downvotes: 0,
      isPublic: true,
      assignedTo: {
        name: 'Игорь Васильев',
        role: 'Специалист домофонной службы',
        phone: '+7 (926) 333-11-29',
      },
    },
  ] as Ticket[],
  bills: [
    {
      id: 'BILL-2026-09',
      period: 'Сентябрь 2026',
      totalAmount: 4820.50,
      paidAmount: 0,
      status: 'pending',
      dueDate: '25 октября 2026',
      items: [
        { name: 'Содержание и ремонт жилья', amount: 2140.00, volume: 68.5, unit: 'м²', rate: 31.24 },
        { name: 'Холодное водоснабжение (ХВС)', amount: 532.80, volume: 4.0, unit: 'м³', rate: 133.20 },
        { name: 'Горячее водоснабжение (ГВС)', amount: 820.50, volume: 3.0, unit: 'м³', rate: 273.50 },
        { name: 'Водоотведение', amount: 447.20, volume: 7.0, unit: 'м³', rate: 63.88 },
        { name: 'Взнос на капремонт', amount: 880.00, volume: 68.5, unit: 'м²', rate: 12.85 },
      ],
    },
    {
      id: 'BILL-2026-08',
      period: 'Август 2026',
      totalAmount: 4610.00,
      paidAmount: 4610.00,
      status: 'paid',
      dueDate: '25 сентября 2026',
      items: [
        { name: 'Содержание и ремонт жилья', amount: 2140.00 },
        { name: 'Водоснабжение и водоотведение', amount: 1590.00 },
        { name: 'Взнос на капремонт', amount: 880.00 },
      ],
    },
  ] as Bill[],
  meterReadings: [
    {
      id: 'mtr-1',
      type: 'cold_water',
      name: 'ХВС (Санузел)',
      serialNumber: 'СХВ-984321',
      previousValue: 142.45,
      currentValue: 146.10,
      unit: 'м³',
      lastVerified: '2028-04-15',
      status: 'submitted',
    },
    {
      id: 'mtr-2',
      type: 'hot_water',
      name: 'ГВС (Санузел)',
      serialNumber: 'СГВ-984322',
      previousValue: 88.20,
      currentValue: 91.50,
      unit: 'м³',
      lastVerified: '2027-11-20',
      status: 'submitted',
    },
    {
      id: 'mtr-3',
      type: 'electricity_t1',
      name: 'Электроэнергия T1 (День)',
      serialNumber: 'ЭЭ-40192',
      previousValue: 1240.00,
      currentValue: 1285.00,
      unit: 'кВт·ч',
      lastVerified: '2030-01-10',
      status: 'submitted',
    },
    {
      id: 'mtr-4',
      type: 'electricity_t2',
      name: 'Электроэнергия T2 (Ночь)',
      serialNumber: 'ЭЭ-40192',
      previousValue: 450.00,
      currentValue: 465.00,
      unit: 'кВт·ч',
      lastVerified: '2030-01-10',
      status: 'submitted',
    },
  ] as MeterReading[],
  parkingPasses: [
    {
      id: 'PAS-01',
      guestCarNumber: 'О777ОО 77',
      guestName: 'Курьер / Доставка мебели',
      spotNumber: 'P-42',
      validFrom: '2026-09-22 10:00',
      validUntil: '2026-09-22 18:00',
      status: 'active',
      qrCodeText: 'MAX-PARK-PASS-99824',
    },
  ] as ParkingPass[],
  meetings: [
    {
      id: 'OSS-2026-03',
      title: 'Общее собрание собственников: шлагбаум и видеонаблюдение',
      type: 'oss',
      initiator: 'Совет дома (кв. 14, 42, 89)',
      status: 'voting_time',
      quorumReached: true,
      quorumPercentage: 68.4,
      description: 'Выбор подрядчика и согласование сметы на установку двух автоматических шлагбаумов с распознаванием номеров на въездах во двор и 12 камер HD-видеонаблюдения по периметру.',
      timeSlots: [
        { id: 'slot-1', datetime: '2026-09-28T19:00:00', label: 'Пн, 28 сен в 19:00', votes: 42 },
        { id: 'slot-2', datetime: '2026-09-29T20:00:00', label: 'Вт, 29 сен в 20:00', votes: 61 },
        { id: 'slot-3', datetime: '2026-10-03T12:00:00', label: 'Сб, 3 окт в 12:00', votes: 24 },
      ],
      userVotedSlotId: 'slot-2',
      selectedDateTime: '2026-09-29T20:00:00',
      documents: [
        { title: 'Смета установки шлагбаума.pdf', url: '#' },
        { title: 'Проект протокола ОСС.pdf', url: '#' },
      ],
    },
  ] as Meeting[],
  threads: [
    {
      id: 'THR-01',
      type: 'official',
      title: 'Итоги проверки системы отопления к зимнему сезону',
      author: 'Дмитрий Морозов',
      authorRole: 'Председатель совета МКД',
      createdAt: 'Вчера в 14:20',
      content: 'Уважаемые соседи! Совместно с инженером УК провели гидравлические испытания узла ввода тепла. Давление в контуре 6.2 атм, протечек не обнаружено. С 1 октября начнется постепенное заполнение стояков.',
      commentsCount: 6,
      viewsCount: 148,
      comments: [
        { id: 'c-1', author: 'Елена К.', apartment: 54, text: 'Спасибо за оперативный отчет!', createdAt: 'Вчера в 15:10' },
        { id: 'c-2', author: 'Артем П.', apartment: 102, text: 'А когда будут развоздушивать верхние этажи?', createdAt: 'Вчера в 16:40' },
      ],
    },
    {
      id: 'THR-02',
      type: 'community_watch',
      title: '«Кто-то видел?»: Задет бампер на гостевой парковке вчера около 21:00',
      author: 'Ирина С.',
      authorApartment: 67,
      createdAt: 'Сегодня в 09:12',
      content: 'Соседи, добрый день! Вчера вечером на парковке у 1-го подъезда белый кроссовер при выезде задел серый Polo. Если у кого-то работал видеорегистратор или кто-то видел момент — напишите, пожалуйста, в личку или сюда!',
      commentsCount: 4,
      viewsCount: 92,
      comments: [
        { id: 'c-3', author: 'Максим В.', apartment: 71, text: 'Камера над подъездом №1 как раз захватывает этот угол. Можно запросить у охраны.', createdAt: 'Сегодня в 09:40' },
        { id: 'c-4', author: 'Галина (Консьерж)', text: 'Запись хранится 14 дней, подходите на пост, посмотрим.', createdAt: 'Сегодня в 10:05' },
      ],
    },
  ] as ThreadPost[],
  staffDirectory: [
    {
      id: 'st-1',
      name: 'Галина Ивановна Кузнецова',
      role: 'Старший консьерж (Подъезд 2)',
      phone: '+7 (495) 700-11-25',
      workingHours: 'Круглосуточно (посменно 1/3)',
      emergencyAvailable: true,
      dutyArea: 'Холл 2 подъезда',
    },
    {
      id: 'st-2',
      name: 'Виктор Петрович Ковалев',
      role: 'Главный сантехник МКД',
      phone: '+7 (926) 333-11-22',
      workingHours: 'Пн-Пт: 08:30 — 17:30 (Аварии 24/7)',
      emergencyAvailable: true,
      dutyArea: 'Водопровод, стояки, теплопункт',
    },
    {
      id: 'st-3',
      name: 'Сергей Николаевич Ермаков',
      role: 'Дежурный электрик',
      phone: '+7 (926) 333-11-23',
      workingHours: 'Пн-Пт: 09:00 — 18:00',
      emergencyAvailable: false,
      dutyArea: 'Освещение МОП, щитовые, ВРУ',
    },
    {
      id: 'st-4',
      name: 'Диспетчерская служба УК «Сервис-Сити»',
      role: 'Единая диспетчерская 24/7',
      phone: '+7 (495) 700-11-22',
      workingHours: 'Круглосуточно, без выходных',
      emergencyAvailable: true,
      dutyArea: 'Все системы дома',
    },
  ] as StaffContact[],
  policeOfficer: {
    name: 'Семенов Артём Викторович',
    rank: 'Майор полиции, Старший участковый',
    phone: '+7 (495) 123-45-67',
    stationAddress: 'г. Москва, ул. Авиаконструктора Миля, д. 8, корп. 1',
    district: 'Участок № 12 (ЮВАО, район Выхино-Жулебино)',
    receptionHours: 'Вт, Чт: 17:00 — 19:00, Сб: 15:00 — 16:00',
    coordinates: { lat: 55.6987, lng: 37.8542 },
  } as PoliceOfficer,
  garbageSchedule: {
    dailyCollection: 'Ежедневно в 06:30 и 14:00 (ТКО)',
    bulkyWaste: 'Вторник и Суббота в 11:00 (Крупногабарит)',
    recycling: 'Ежедневно (синие контейнеры для пластика/стекла/бумаги)',
    platformStatus: 'Контейнерная площадка у 2 подъезда: убрана, свободно',
  },
  marketplace: [
    {
      id: 'MK-01',
      title: 'Детская прогулочная коляска Cybex Eezy S',
      category: 'goods',
      price: 6500,
      priceFormatted: '6 500 ₽',
      apartment: 58,
      authorName: 'Ольга',
      phone: '+7 (916) 123-45-88',
      createdAt: 'Сегодня в 11:30',
      description: 'В отличном состоянии, после одного ребенка. Очень компактная, легко складывается в багажник. Забирать во 2 подъезде.',
    },
    {
      id: 'MK-02',
      title: 'Стремянка алюминиевая 2.5 м (в аренду/попользоваться)',
      category: 'free',
      price: 0,
      priceFormatted: 'Бесплатно / за спасибо',
      apartment: 42,
      authorName: 'Алексей (кв. 42)',
      phone: '+7 (916) 555-01-42',
      createdAt: 'Вчера',
      description: 'Соседи, если кому нужно повесить карниз или люстру — берите, стоит в тамбуре.',
    },
    {
      id: 'MK-03',
      title: 'Мастер: мелкий ремонт сантехники и электрики',
      category: 'services',
      price: 800,
      priceFormatted: 'от 800 ₽',
      apartment: 89,
      authorName: 'Михаил (сосед из 3 подъезда)',
      phone: '+7 (903) 777-22-11',
      createdAt: '2 дня назад',
      description: 'Замена смесителей, розеток, сифонов, сборка полок и шкафов. Без посредников.',
    },
  ] as MarketplaceItem[],
  carReports: [
    {
      id: 'CAR-01',
      carNumber: 'А987ВС 199',
      issueType: 'blocked_exit',
      location: 'Выезд со двора у ворот №1',
      reportedAt: 'Вчера в 18:40',
      status: 'resolved',
      description: 'Перекрыл проезд мусоровозу и скорой.',
    },
  ],
  neighborMessages: [] as {
    id: string;
    fromApartment: number;
    toApartment: number;
    topic: string;
    text: string;
    sentAt: string;
    status: 'sent' | 'delivered';
  }[],
};
