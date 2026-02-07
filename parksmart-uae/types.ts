
export enum City {
  DUBAI = 'Dubai',
  ABU_DHABI = 'Abu Dhabi',
  SHARJAH = 'Sharjah',
  AJMAN = 'Ajman'
}

export enum ParkingType {
  STANDARD = 'Standard',
  PREMIUM = 'Premium',
  ZONE_A = 'Zone A',
  ZONE_B = 'Zone B',
  ZONE_C = 'Zone C',
  ZONE_D = 'Zone D',
  ZONE_F = 'Zone F',
  ZONE_G = 'Zone G',
  ZONE_H = 'Zone H',
  ZONE_J = 'Zone J',
  ZONE_K = 'Zone K'
}

export interface Vehicle {
  id: string;
  nickname: string;
  plate: string;
  code: string;
  emirate: City;
  isDefault: boolean;
  color: string;
}

export interface ParkingSession {
  id: string;
  city: City;
  zone: string;
  startTime: number;
  durationMinutes: number;
  type: ParkingType;
  vehicleId: string;
  smsSent: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'warning' | 'success';
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
}
