import { apiClient } from '../client';

const BASE = '/api/v1/admin/partners';

export type PaymentMethodType = 'card' | 'link';

export interface Partner {
  id: number;
  code: string;
  display_name: string;
  prefix: string;
  group_chat_id: number | null;
  is_dm_partner: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerUpdate {
  display_name?: string;
  group_chat_id?: number | null;
  is_active?: boolean;
}

export interface PaymentMethod {
  id: number;
  partner_id: number;
  method_type: PaymentMethodType;
  card_number: string | null;
  card_holder: string | null;
  link_label: string | null;
  link_url: string | null;
  is_active: boolean;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodCreate {
  method_type: PaymentMethodType;
  card_number?: string;
  card_holder?: string;
  link_label?: string;
  link_url?: string;
  is_active?: boolean;
  weight?: number;
}

export interface PaymentMethodUpdate {
  card_number?: string;
  card_holder?: string;
  link_label?: string;
  link_url?: string;
  is_active?: boolean;
  weight?: number;
}

export interface PartnerFotoHisobot {
  partner_id: number;
  foto_hisobot: string;
  updated_at: string;
}

export interface FlightAlias {
  id: number;
  partner_id: number;
  real_flight_name: string;
  mask_flight_name: string;
  created_at: string;
}

export interface FlightAliasCreate {
  real_flight_name: string;
  mask_flight_name: string;
}

// Partners
export async function listPartners(): Promise<Partner[]> {
  const res = await apiClient.get<Partner[]>(BASE);
  return res.data;
}

export async function getPartner(partnerId: number): Promise<Partner> {
  const res = await apiClient.get<Partner>(`${BASE}/${partnerId}`);
  return res.data;
}

export async function updatePartner(partnerId: number, body: PartnerUpdate): Promise<Partner> {
  const res = await apiClient.patch<Partner>(`${BASE}/${partnerId}`, body);
  return res.data;
}

// Payment methods
export async function listPaymentMethods(partnerId: number, onlyActive = false): Promise<PaymentMethod[]> {
  const res = await apiClient.get<PaymentMethod[]>(`${BASE}/${partnerId}/payment-methods`, {
    params: { only_active: onlyActive },
  });
  return res.data;
}

export async function createPaymentMethod(partnerId: number, body: PaymentMethodCreate): Promise<PaymentMethod> {
  const res = await apiClient.post<PaymentMethod>(`${BASE}/${partnerId}/payment-methods`, body);
  return res.data;
}

export async function updatePaymentMethod(
  partnerId: number,
  methodId: number,
  body: PaymentMethodUpdate,
): Promise<PaymentMethod> {
  const res = await apiClient.patch<PaymentMethod>(
    `${BASE}/${partnerId}/payment-methods/${methodId}`,
    body,
  );
  return res.data;
}

export async function deletePaymentMethod(partnerId: number, methodId: number): Promise<void> {
  await apiClient.delete(`${BASE}/${partnerId}/payment-methods/${methodId}`);
}

// Foto-hisobot
export async function getFotoHisobot(partnerId: number): Promise<PartnerFotoHisobot> {
  const res = await apiClient.get<PartnerFotoHisobot>(`${BASE}/${partnerId}/foto-hisobot`);
  return res.data;
}

export async function updateFotoHisobot(partnerId: number, foto_hisobot: string): Promise<PartnerFotoHisobot> {
  const res = await apiClient.put<PartnerFotoHisobot>(`${BASE}/${partnerId}/foto-hisobot`, {
    foto_hisobot,
  });
  return res.data;
}

// Flight aliases
export async function listAliases(partnerId: number, limit = 100): Promise<FlightAlias[]> {
  const res = await apiClient.get<FlightAlias[]>(`${BASE}/${partnerId}/aliases`, {
    params: { limit },
  });
  return res.data;
}

export async function createAlias(
  partnerId: number,
  body: FlightAliasCreate,
): Promise<FlightAlias> {
  const res = await apiClient.post<FlightAlias>(`${BASE}/${partnerId}/aliases`, body);
  return res.data;
}

export async function updateAlias(
  partnerId: number,
  aliasId: number,
  mask_flight_name: string,
): Promise<FlightAlias> {
  const res = await apiClient.patch<FlightAlias>(
    `${BASE}/${partnerId}/aliases/${aliasId}`,
    { mask_flight_name },
  );
  return res.data;
}

export async function deleteAlias(partnerId: number, aliasId: number): Promise<void> {
  await apiClient.delete(`${BASE}/${partnerId}/aliases/${aliasId}`);
}
