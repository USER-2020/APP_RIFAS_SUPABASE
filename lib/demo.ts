export type Raffle = { id: string; slug: string; title: string; description: string; prize_name: string; price_per_number: number; number_start: number; number_end: number; draw_at: string; sales_close_at: string; status: string; accent: string; mark: string };

export const demoRaffles: Raffle[] = [
  { id: "demo-iphone", slug: "iphone-16-pro", title: "iPhone 16 Pro", description: "Un iPhone 16 Pro de 256 GB para llevar tus ideas más lejos.", prize_name: "iPhone 16 Pro 256 GB", price_per_number: 10000, number_start: 0, number_end: 99, draw_at: "2026-10-07T20:00:00-05:00", sales_close_at: "2026-10-07T18:00:00-05:00", status: "active", accent: "#dfe3ff", mark: "16" },
  { id: "demo-ps5", slug: "playstation-5", title: "PlayStation 5", description: "PS5 Slim con dos controles para la próxima partida.", prize_name: "PS5 Slim + 2 controles", price_per_number: 5000, number_start: 0, number_end: 99, draw_at: "2026-10-18T20:00:00-05:00", sales_close_at: "2026-10-18T18:00:00-05:00", status: "active", accent: "#dff8ed", mark: "PS" },
  { id: "demo-cash", slug: "millon-en-efectivo", title: "$1.000.000", description: "Un millón de pesos para usarlo en lo que quieras.", prize_name: "Un millón de pesos", price_per_number: 10000, number_start: 0, number_end: 99, draw_at: "2026-10-31T20:00:00-05:00", sales_close_at: "2026-10-31T18:00:00-05:00", status: "active", accent: "#fff0d7", mark: "$" },
];

export const getDemoRaffle = (slug: string) => demoRaffles.find((raffle) => raffle.slug === slug);
export const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
export const date = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));