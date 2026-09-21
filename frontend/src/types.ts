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
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  qrCodeText: string;
}

export interface MeetingTimeSlot {
  id: string;
  datetime: string;
  label: string;
  votes: number;
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
  timeSlots: MeetingTimeSlot[];
  userVotedSlotId?: string;
  selectedDateTime?: string;
  documents: { title: string; url: string }[];
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
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  apartment: number;
  entrance: number;
  floor: number;
  accountNumber: string;
  registeredCars: string[];
  parkingSpot: string;
  hasCoveredParking: boolean;
  role?: 'resident' | 'admin';
}

export interface ComplexInfo {
  name: string;
  address: string;
  managementCompany: string;
  building: number;
  entranceCount: number;
  apartmentsCount: number;
}
