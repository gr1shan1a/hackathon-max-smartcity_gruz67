export interface Outage {
  id: string;
  title: string;
  type?: 'water' | 'electricity' | 'heating' | 'elevator';
  service?: string;
  status: 'active' | 'scheduled' | 'resolved' | 'planned';
  period?: string;
  affected?: string;
  description: string;
  updatedAt?: string;
  startDate?: string;
  endDate?: string;
  scopeType?: 'complex' | 'building' | 'entrance';
  scopeId?: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: 'elevator' | 'plumbing' | 'electric' | 'cleaning' | 'intercom' | 'parking' | 'other';
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  apartment: number;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
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
  masterName?: string;
  masterComment?: string;
  completionPhoto?: string;
}

export interface BillItem {
  name: string;
  amount: number;
  unit?: string;
  volume?: number;
  rate?: number;
}

export interface Bill {
  id: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  items: BillItem[];
}

export interface MeterHistoryEntry {
  date: string;
  value: number;
  consumption: number;
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
  lastSubmissionDate?: string;
  status: 'submitted' | 'due' | 'pending';
  history?: MeterHistoryEntry[];
}

export interface ParkingPass {
  id: string;
  guestCarNumber: string;
  guestName: string;
  spotNumber: string;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  qrCodeText: string;
}

export interface MeetingTimeSlot {
  id: string;
  datetime: string;
  label?: string;
  votes: number;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'oss' | 'informal';
  initiator?: string;
  status: 'voting' | 'voting_time' | 'scheduled' | 'completed' | 'past';
  date?: string;
  format?: string;
  quorum?: string;
  quorumReached?: boolean;
  quorumPercentage?: number;
  description: string;
  timeSlots: MeetingTimeSlot[];
  userVotedSlotId?: string;
  selectedDateTime?: string;
  documents?: { title: string; url: string }[];
}

export interface ThreadComment {
  id: string;
  author: string;
  apartment?: number;
  text: string;
  createdAt: string;
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
  comments: ThreadComment[];
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
  status?: 'active' | 'sold';
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  scopeType: 'complex' | 'building' | 'entrance';
  scopeId: string;
  pollType?: 'single' | 'multiple';
  options: PollOption[];
  allowMultiple: boolean;
  anonymous: boolean;
  showResultsBeforeEnd: boolean;
  startsAt?: string;
  endsAt?: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  createdAt: string;
  totalVotes?: number;
  userVotedOptionIds?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  text: string;
  category: 'water' | 'elevator' | 'cleaning' | 'parking' | 'maintenance' | 'emergency' | 'general' | 'info';
  scopeType: 'complex' | 'building' | 'entrance';
  scopeId: string;
  validUntil?: string;
  isOfficial: boolean;
  urgent?: boolean;
  authorName: string;
  authorRole?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  apartment: number;
  entrance: number;
  floor: number;
  accountNumber?: string;
  personalAccount?: string;
  address?: string;
  building?: number;
  ownershipStatus?: string;
  registeredCars: string[];
  parkingSpot: string;
  hasCoveredParking: boolean;
  role?: 'resident' | 'admin' | 'manager' | 'chairman';
  notifications?: {
    outages?: boolean;
    bills?: boolean;
    polls?: boolean;
    neighborMessages?: boolean;
    parking?: boolean;
  };
  privacy?: {
    hideApartment?: boolean;
    hidePhone?: boolean;
  };
}

export interface ComplexInfo {
  name: string;
  address: string;
  managementCompany: string;
  building: number;
  entranceCount: number;
  apartmentsCount: number;
}
