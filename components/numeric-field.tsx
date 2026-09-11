"use client";
import { useId } from "react";

type NumericFieldProps = { name: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; min?: number; max?: number };
const displayNumber = (value: string) => value ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Number(value)) : "";

export default function NumericField({ name, label, value, onChange, placeholder, required = true, min, max }: NumericFieldProps) {
  const id = useId();
  function handleChange(next: string) { const digits = next.replace(/\D/g, ""); onChange(digits); }
  return <label htmlFor={id} className="block sans text-sm font-bold">{label}<input id={id} type="text" inputMode="numeric" value={displayNumber(value)} onChange={(event) => handleChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#6d4aff] focus:ring-4 focus:ring-[#6d4aff12]" />{required && <input type="hidden" name={name} value={value} required />}{!required && <input type="hidden" name={name} value={value} />}{min !== undefined && value && Number(value) < min && <span className="mt-1 block text-xs font-normal text-red-600">El valor mínimo es {displayNumber(String(min))}.</span>}{max !== undefined && value && Number(value) > max && <span className="mt-1 block text-xs font-normal text-red-600">El valor máximo es {displayNumber(String(max))}.</span>}</label>;
}
