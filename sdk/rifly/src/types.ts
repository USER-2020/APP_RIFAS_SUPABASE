export type RaffleStatus = "draft" | "active" | "closed" | "finished";

export type CreateRaffleInput = {
  title: string;
  slug: string;
  description: string;
  prizeName: string;
  pricePerNumber: number;
  numberStart: number;
  numberEnd: number;
  salesCloseAt: string | Date;
  drawAt: string | Date;
  drawMethod: string;
  whatsappNumber?: string | null;
  paymentInstructions?: string | null;
  reservationMinutes?: number;
  status?: Extract<RaffleStatus, "draft" | "active">;
};

export type UpdateRaffleInput = Partial<Omit<CreateRaffleInput, "numberStart" | "numberEnd">>;

export type RaffleReference = {
  id: string;
  slug: string;
  title?: string;
  status?: RaffleStatus;
  organizationId?: string;
  publicUrl?: string;
  updatedAt?: string;
};

export type Raffle = {
  id: string;
  title: string;
  slug: string;
  description: string;
  prize_name: string;
  price_per_number: number;
  number_start: number;
  number_end: number;
  sales_close_at: string;
  draw_at: string;
  draw_method: string;
  whatsapp_number: string | null;
  payment_instructions: string | null;
  reservation_minutes: number;
  status: RaffleStatus;
  image_path: string | null;
  is_featured: boolean;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateParticipationTokenInput = {
  externalPurchaseId: string;
  externalUserId?: string | null;
  allowedNumbers: number;
  expiresAt?: string | Date;
  customer: {
    name: string;
    email?: string | null;
    phone: string;
  };
};

export type ParticipationToken = {
  token: string;
  tokenId: string;
  allowedNumbers: number;
  expiresAt: string;
  embedUrl: string;
};

export type ImageUploadResult = {
  id: string;
  imagePath: string;
  imageUrl: string;
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type RiflyClientOptions = {
  /** URL raíz de Rifly, por ejemplo https://rifly.online */
  baseUrl: string;
  /** Token permanente. Sólo debe configurarse en un servidor o BFF. */
  token: string;
  fetch?: FetchLike;
};
