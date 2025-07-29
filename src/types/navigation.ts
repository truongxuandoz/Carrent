export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  BikeDetail: { bikeId?: string };
  BookingDetail: { bikeId?: string; bookingId?: string; isRebooking?: boolean };
  BookingDetailView: { bookingId: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Notifications: undefined;
  Profile: undefined;
  Admin: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 