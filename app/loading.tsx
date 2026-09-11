import Spinner from "@/components/spinner";

export default function Loading() {
  return <div role="status" className="flex min-h-60 items-center justify-center gap-3 p-8 sans text-[#6d4aff]"><Spinner />Cargando...</div>;
}
