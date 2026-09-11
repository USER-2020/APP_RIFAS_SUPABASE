"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import Spinner from "@/components/spinner";

function Indicator() {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/95 text-[#6d4aff]"><Spinner /><span className="sr-only">Cargando página...</span></span> : null;
}

export default function LoadingLink({ children, className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} className={`loading-link ${className}`}>{children}<Indicator /></Link>;
}
