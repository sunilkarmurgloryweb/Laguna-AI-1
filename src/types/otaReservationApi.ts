export interface GetWhoamiResponse {
  message: string;
  tenant: string;
  user: {
    id: number;
    user_name: string;
    user_role: string;
    user_tenant: string;
  };
  permissions: {
    reservation: ('create' | 'read' | 'update' | 'cancel')[];
    guest: ('create' | 'read' | 'update' | 'delete')[];
    payments: ('FULL_PAYMENT' | 'PAY_IN_ADVANCE')[];
  };
}

export interface GetOrgResponse {
  name: string;
  phone: string;
  address: string;
  email: string;
  description: string;
  logo: string;
  id: number;
  child_property: ChildProperty[];
}

export interface ChildProperty {
  id: number;
  name: string;
  slogan: string;
  description: string;
  logo: string;
  cover_photo: string;
  country: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  zip_code: string;
  timezone: string;
  currency: string;
  email: string;
  phone: string;
  phone_toll_free: string;
  fax: string;
  website: string;
  rating_avg: number;
  rating_star: number;
  price_avg: string;
  tax_rate: number;
  floor_count: number;
  room_count: number;
  occupancy_count: number;
  lat: number;
  lng: number;
  is_active: boolean;
  organization_id: number;
  mandatory_stay_service: boolean;
  mandatory_stay_service_days: number;
  mandatory_stay_service_longterm: boolean;
  mandatory_stay_service_longterm_days: number;
  max_reservations_per_request: number;
  checkin_time: string;
  checkout_time: string;
  max_stay_duration_days: number;
  cancellation_policy: string;
  cancellation_policy_duration_days: number;
  terms_and_conditions: string;
  notification_email: string;
  notification_sms: string | null;
  meta_data: any | null;
  booking_window: number;
}

export type GetPropertiesResponse = GetOrgResponse;


export interface ParentOrganization {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  description: string;
  logo: string;
}

export interface GetPropertyDetailResponse {
  id: number;
  name: string;
  slogan: string;
  description: string;
  logo: string;
  cover_photo: string;
  country: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  zip_code: string;
  timezone: string;
  currency: string;
  email: string;
  phone: string;
  phone_toll_free: string;
  fax: string;
  website: string;
  rating_avg: number;
  rating_star: number;
  price_avg: string;
  tax_rate: number;
  floor_count: number;
  room_count: number;
  occupancy_count: number;
  lat: number;
  lng: number;
  is_active: boolean;
  organization_id: number;
  mandatory_stay_service: boolean;
  mandatory_stay_service_days: number;
  mandatory_stay_service_longterm: boolean;
  mandatory_stay_service_longterm_days: number;
  max_reservations_per_request: number;
  checkin_time: string;
  checkout_time: string;
  max_stay_duration_days: number;
  cancellation_policy: string;
  cancellation_policy_duration_days: number;
  terms_and_conditions: string;
  notification_email: string;
  notification_sms: string | null;
  meta_data: any;
  booking_window: number;
  created_at: string;
  updated_at: string;
  parent_organization: ParentOrganization;
}

export interface Amenity {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  featured: boolean;
  additional_charge: boolean;
  charge: number;
  icon_path: string;
}

export interface RoomType {
  id: number;
  type: string;
  name: string;
  rental_type: string;
  type_description: string;
  image: string | null;
  size_area: number;
  smoking: number;
  adults: number;
  children: number;
  size_beds: number;
  property_id: number;
  occupancy: number;
  amenities: Amenity[];
}

export interface AvailabilityItem {
  room_type_id: number;
  rooms_needed_of_this_type: number;
  rooms_available: number;
  pricing: {
    [date: string]: string;
  };
  room_type: RoomType;
}

export interface Tax {
  id: number;
  name: string;
  rate: number;
  description: string;
  starts_from: string;
  type: string;
  occurrence: string | null;
  assignment_type: string | null;
  taxable: boolean;
}

export interface Fee {
  id: number;
  name: string;
  rate: number;
  description: string;
  starts_from: string;
  type: string;
  occurrence: string | null;
  assignment_type: string | null;
  taxable: boolean;
}

export interface GetAvailabilityResponse {
  reservation_token: string;
  availability: AvailabilityItem[];
  taxes: Tax[];
  fees: Fee[];
}

export interface GetAvailabilityRequest {
  start_date: string; // e.g. "2025-07-22"
  end_date: string;   // e.g. "2025-07-25"
  number_of_guests: number;
  property_id: number;
}

export interface RoomTypeItem {
  id: number;
  name: string;
  type: string;
  type_description: string;
  rental_type: string;
  size_beds: number;
  size_area: string;
  adults: number;
  children: number;
  occupancy: number;
  smoking: boolean;
  inventory: number;
  image: string | null;
  type_icon: string;
  property_id: number;
  created_at: string;
  updated_at: string;
}

export type GetRoomTypesResponse = RoomTypeItem[];

export interface GetRoomTypesRequest {
  property_id: number;
}

export interface GetReservationRequest {
  reservation_id: number;
}

export interface GetReservationResponse {
  reservation_detail: ReservationDetail;
  property_detail: PropertyDetail;
}

// Define types for nested structures (simplified or as needed)
export interface ReservationDetail {
  id: number;
  confirmation_id: string;
  balance: number;
  status: string;
  is_guaranteed: boolean;
  start_date: string;
  end_date: string;
  special_requests: string;
  children_count: number;
  adults_count: number;
  reservation_holder_info: PersonInfo;
  guests: PersonInfo[];
  room_type: RoomType;
  rate_code: RateCode;
  reservation_stay_details: StayDetail[];
  current_room_info: RoomInfo;
  planned_room: RoomInfo;
  folios: Folio[];
  payments: Payment[];
  comments: Comment[];
  group: {
    reservations: { id: number; confirmation_id: string }[];
  };
}

export interface PersonInfo {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  cell_phone: string;
  email: string;
  address: string;
  country: string;
  gender: string;
  birth_date: string;
  document_type: string;
  document_number: string;
  document_issue_date: string;
  document_expiration_date: string;
  document_issuing_country: string;
  note: string;
  tax_id: string;
  company_name: string;
  company_tax_id: string;
  created_at: string;
  updated_at: string;
}

export interface RateCode {
  id: number;
  name: string;
  description: string;
  suppressed: boolean;
  type: string;
  property_id: number;
  parent_rate_code_id: number;
  rate_plan: {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    property_id: number;
    rules: any[];
    typed_rules: Record<string, unknown>;
  };
}

export interface StayDetail {
  date: string;
  room_id: string;
  room_info: { room_number: string };
  nightly_rate: string;
  custom_rate: boolean;
}

export interface RoomInfo {
  id: number;
  room_number: string;
  housekeeping_status: string;
  frontdesk_status: string;
  room_type_id: number;
  wing: string;
  floor: number;
  room_status_linking: { room_status: string }[];
}

export interface Payment {
  id: number;
  amount: number;
  status: string;
  payment_date: string;
  description: string;
  refunds: any[];
  charges: any[];
  pp_response: Record<string, unknown>;
  folio_id: number;
  reservation_id: number;
  remaining_amount: number;
  amount_needed_to_settle: number;
}

export interface Folio {
  id: number;
  balance: number;
  amount_needed_to_settle: number;
  type: string;
  charges: any[];
  payments: Payment[];
  primary_payment_method: any;
}

export interface Comment {
  id: number;
  reservation_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyDetail {
  id: number;
  name: string;
  description: string;
  logo: string;
  address_1: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  checkin_time: string;
  checkout_time: string;
  occupancy_count: number;
  max_stay_duration_days: number;
  cancellation_policy: string;
}

export interface PostReservationRequest {
  payment: string;
  status: string;
  start_date: string;
  end_date: string;
  prop_id: number;
  booking_channel: string;
  reservation_token: string;
  market_segment: string;
  rate_code: number;
  guest: number;
  stays: Stay[];
}

export interface Stay {
  room_type_id: number;
  room_id: number;
  primary_guest: boolean;
  guests: GuestInfo[];
  special_requests: string;
  children_count: number;
  adults_count: number;
  expected_checkin_time: string;
  expected_checkout_time: string;
  comment: string;
  tax_exemption_id: number;
}

export interface GuestInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  gender: string;
  birth_date: string;
}

export interface PostReservationResponse {
  success: boolean;
  message?: string;
  reservation_id?: number;
  confirmation_id?: string;
}

export interface GetCalculateStayResponse {
  room_wise_prices: RoomWisePrice[];
  total_payment: number;
  total_taxes: number;
  total_fees: number;
  final_payment: number;
  tax_details: TaxDetails;
  rate_code_details: RateCodeDetails;
}

export interface RoomWisePrice {
  room_type: string;
  room_price: string;
}

export interface TaxDetails {
  tax_id: number;
  tax_rate: string;
  tax_type: string;
  tax_percentage: string;
}

export interface RateCodeDetails {
  rate_code_id: number;
  rate_code_name: string;
}

