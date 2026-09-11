"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "@/components/spinner";

type Props = ComponentProps<"button"> & { loading?: boolean; loadingText?: string };

export default function LoadingButton({ loading = false, loadingText = "Procesando...", disabled, children, className = "", type = "submit", ...props }: Props) {
  const { pending } = useFormStatus();
  const busy = loading || (type === "submit" && pending);
  return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy} className={`loading-button ${className}`}>
    <span className={busy ? "invisible contents" : "contents"}>{children}</span>
    {busy && <span className="absolute inset-0 flex items-center justify-center gap-2 px-2" role="status"><Spinner /><span className="sr-only">{loadingText}</span></span>}
  </button>;
}
