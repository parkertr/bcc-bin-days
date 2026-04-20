export interface PropertyInfo {
  property_number: string;
  address: string;
  suburb: string;
  collection_day: string;
  zone: string;
}

export interface BinSchedule {
  date: string;
  day_name: string;
  general_waste: boolean;
  recycling: boolean;
  green_waste: boolean;
  days_until: number;
}

export interface LookupResponse {
  property: PropertyInfo;
  next_bin_days: BinSchedule[];
  as_of: string;
}

export interface AddressParams {
  suburb: string;
  street: string;
  number?: string;
}
