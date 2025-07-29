export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatar?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bike {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: 'scooter' | 'manual' | 'sport' | 'electric';
  engineCapacity: number;
  fuelType: 'gasoline' | 'electric';
  transmission: 'automatic' | 'manual';
  color: string;
  licensePlate: string;
  description: string;
  specifications: BikeSpecifications;
  images: string[];
  pricePerDay: number;
  pricePerHour: number;
  deposit: number;
  insurance: number;
  location: Location;
  owner: User;
  isAvailable: boolean;
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BikeSpecifications {
  engineCapacity: number;
  fuelCapacity: number;
  maxSpeed: number;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  district: string;
}

export interface Booking {
  id: string;
  bike: Bike;
  customer: User;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  pickupLocation: Location;
  deliveryLocation?: Location;
  deliveryType: 'pickup' | 'delivery';
  totalPrice: number;
  deposit: number;
  insurance: number;
  deliveryFee: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'cash' | 'card';
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  booking: Booking;
  customer: User;
  bike: Bike;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  user: User;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'emergency' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface EmergencyReport {
  id: string;
  booking: Booking;
  customer: User;
  type: 'accident' | 'breakdown' | 'theft' | 'other';
  description: string;
  location: Location;
  contact: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'vnpay' | 'momo' | 'zalopay' | 'cash' | 'card';
  icon: string;
  isEnabled: boolean;
}

export interface AppSettings {
  language: 'vi' | 'en';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  locationServices: boolean;
  privacy: {
    shareLocation: boolean;
    shareData: boolean;
  };
} 