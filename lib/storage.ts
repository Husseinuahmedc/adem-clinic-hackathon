export type BookingStatus = 'new' | 'confirmed' | 'complaint' | 'closed';

export type Booking = {
  id: string;
  name: string;
  age: number;
  area: string;
  bookingReason?: string;
  phone?: string;
  source?: 'web' | 'whatsapp';
  status: BookingStatus;
  createdAt: string;
  appointmentDate?: string;
  appointmentTime?: string;
  note?: string;
  resolutionNote?: string;
  followUpDate?: string;
  arrivalAt?: string;
  confirmationSentAt?: string;
};

export const STORAGE_KEY = 'clinic-demo-bookings-v1';

const seededBookings: Booking[] = [
  { id: 'seed-1', name: 'سارة أحمد', age: 27, area: 'المنصور', phone: '07701234567', status: 'new', createdAt: '2026-11-06T08:20:00.000Z' },
  { id: 'seed-2', name: 'علي حسن', age: 42, area: 'الكرادة', status: 'new', createdAt: '2026-11-06T09:05:00.000Z' },
  { id: 'seed-3', name: 'نور محمد', age: 8, area: 'الأعظمية', phone: '07809876543', status: 'confirmed', createdAt: '2026-11-05T10:10:00.000Z', appointmentDate: '2026-11-08', appointmentTime: '10:30', note: 'يفضل الموعد الصباحي' },
  { id: 'seed-4', name: 'حسن كريم', age: 66, area: 'زيونة', phone: '07901112233', status: 'confirmed', createdAt: '2026-11-05T11:40:00.000Z', appointmentDate: '2026-11-07', appointmentTime: '12:00' },
  { id: 'seed-5', name: 'ريم فاضل', age: 34, area: 'الدورة', status: 'complaint', createdAt: '2026-11-04T12:15:00.000Z', resolutionNote: 'بانتظار التواصل مع المريضة' },
  { id: 'seed-6', name: 'مريم قاسم', age: 15, area: 'المنصور', phone: '07704445566', status: 'closed', createdAt: '2026-11-03T13:00:00.000Z', resolutionNote: 'تمت المتابعة وإغلاق الشكوى' },
];

export function getSeededBookings(): Booking[] {
  return seededBookings.map((booking) => ({ ...booking }));
}

export function readBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = getSeededBookings();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

export function writeBookings(bookings: Booking[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function ageGroup(age: number): string {
  if (age <= 17) return '0–17';
  if (age <= 35) return '18–35';
  if (age <= 55) return '36–55';
  return '56+';
}

export const ageGroups = ['0–17', '18–35', '36–55', '56+'];
