import ReservationDetail from "@/components/reservation-detail";

export const metadata = { title: "Verificar reserva | RIFLY", robots: { index: false, follow: false } };

export default async function ReservationPage({ params }: { params: Promise<{ code: string }> }) {
  return <ReservationDetail code={(await params).code} />;
}