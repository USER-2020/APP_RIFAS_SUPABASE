import { RiflyApiError } from "./errors";
import type {
  CreateParticipationTokenInput,
  CreateRaffleInput,
  FetchLike,
  ImageUploadResult,
  ParticipationToken,
  Raffle,
  RaffleReference,
  RiflyClientOptions,
  UpdateRaffleInput,
} from "./types";

const defaultFetch: FetchLike = (...args) => fetch(...args);

function isoDate(value: string | Date | undefined) {
  return value instanceof Date ? value.toISOString() : value;
}

export class RiflyClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly fetcher: FetchLike;

  constructor(options: RiflyClientOptions) {
    if (!options.baseUrl) throw new Error("RiflyClient requiere baseUrl");
    if (!options.token) throw new Error("RiflyClient requiere token");
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.fetcher = options.fetch ?? defaultFetch;
  }

  async createRaffle(input: CreateRaffleInput): Promise<RaffleReference> {
    return this.request<RaffleReference>("/api/v1/raffles", {
      method: "POST",
      body: {
        ...input,
        salesCloseAt: isoDate(input.salesCloseAt),
        drawAt: isoDate(input.drawAt),
      },
    });
  }

  async getRaffle(id: string): Promise<{ raffle: Raffle }> {
    return this.request<{ raffle: Raffle }>(`/api/v1/raffles/${encodeURIComponent(id)}`);
  }

  async updateRaffle(id: string, input: UpdateRaffleInput): Promise<RaffleReference> {
    return this.request<RaffleReference>(`/api/v1/raffles/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        ...input,
        ...(input.salesCloseAt === undefined ? {} : { salesCloseAt: isoDate(input.salesCloseAt) }),
        ...(input.drawAt === undefined ? {} : { drawAt: isoDate(input.drawAt) }),
      },
    });
  }

  async createParticipationToken(raffleId: string, input: CreateParticipationTokenInput): Promise<ParticipationToken> {
    return this.request<ParticipationToken>(`/api/v1/raffles/${encodeURIComponent(raffleId)}/participation-tokens`, {
      method: "POST",
      body: { ...input, expiresAt: isoDate(input.expiresAt) },
    });
  }

  async uploadRaffleImage(raffleId: string, image: Blob, filename = "cover.webp"): Promise<ImageUploadResult> {
    const form = new FormData();
    form.append("image", image, filename);
    return this.request<ImageUploadResult>(`/api/v1/raffles/${encodeURIComponent(raffleId)}/image`, {
      method: "POST",
      body: form,
      isMultipart: true,
    });
  }

  private async request<T>(path: string, options: { method?: string; body?: unknown; isMultipart?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
    };
    const init: RequestInit = { method: options.method ?? "GET", headers };

    if (options.body instanceof FormData || options.isMultipart) {
      init.body = options.body as BodyInit;
    } else if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetcher(`${this.baseUrl}${path}`, init);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `La API de Rifly respondió con ${response.status}`;
      throw new RiflyApiError(message, response.status, payload);
    }
    return payload as T;
  }
}

export function createRiflyClient(options: RiflyClientOptions) {
  return new RiflyClient(options);
}
