export type ParcelStatus = 'Pending' | 'Collected';
export type LockerStatus = 'Empty' | 'Occupied';
export type UserRole = 'admin' | 'student';

export interface Parcel {
  id?: string;
  studentName: string;
  studentEmail: string;
  lockerNumber: number;
  otp: string;
  status: ParcelStatus;
  createdAt: any; // Timestamp
  collectedAt?: any; // Timestamp
  adminUid: string;
}

export interface Locker {
  id?: string;
  number: number;
  status: LockerStatus;
  lastUpdated: any; // Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}
