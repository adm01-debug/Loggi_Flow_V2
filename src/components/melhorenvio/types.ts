// Shared types for Melhor Envio components

export interface MEQuotationResult {
  id: number;
  name: string;
  price: string;
  custom_price?: string;
  discount?: string;
  delivery_time?: number;
  error?: string;
  company?: {
    id: number;
    name: string;
    picture?: string;
  };
}

export interface MECartItem {
  id: string;
  service?: string;
  company?: { id: number; name: string };
  to?: { postal_code?: string };
  price?: string;
  delivery_time?: number;
}

export interface MEOrder {
  id: string;
  service?: string;
  to?: { postal_code?: string };
  status?: string;
  price?: string;
  tracking?: string;
}

export interface MECompany {
  id: number | string;
  name: string;
  picture?: string;
}

export interface MEService {
  id: number | string;
  name: string;
  company?: { name: string };
  type?: string;
}

export interface MEAgency {
  id: number | string;
  name: string;
  address?: string;
  city?: string;
}

export interface MEUserInfo {
  firstname?: string;
  lastname?: string;
  email?: string;
  document?: string;
  phone?: { phone?: string };
}

export interface MEBalance {
  balance?: number | string;
}

export interface MEAddress {
  label?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state_abbr?: string;
  postal_code?: string;
}

export interface MEStore {
  id: string;
  name: string;
  document?: string;
  company_document?: string;
  email?: string;
  description?: string;
}

export interface METrackingEvent {
  title?: string;
  status?: string;
  description?: string;
  date?: string;
}

export interface METrackingInfo {
  tracking?: string;
  status?: string;
  melhorenvio_tracking?: METrackingEvent[];
}
