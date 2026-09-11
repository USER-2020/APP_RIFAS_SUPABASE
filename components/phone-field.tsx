"use client";
import PhoneInput from "react-phone-input-2";

type PhoneFieldProps = { name: string; label: string; value?: string; onChange?: (value: string) => void; required?: boolean; error?: string };

export default function PhoneField({ name, label, value = "", onChange, required = false, error }: PhoneFieldProps) {
  return <div><label htmlFor={name} className="sans mb-1.5 block text-sm font-bold">{label}</label><PhoneInput country="co" value={value} onChange={(phone) => onChange?.(phone)} countryCodeEditable={false} enableSearch preferredCountries={["co"]} inputProps={{ id: name, name, required, autoComplete: "tel" }} containerClass="!w-full" inputClass="!h-[50px] !w-full !rounded-xl !border-slate-200 !bg-white !text-sm !shadow-none focus:!border-[#6d4aff]" buttonClass="!rounded-l-xl !border-slate-200 !bg-white" dropdownClass="!sans" />{error && <p className="sans mt-1 text-xs text-red-600">{error}</p>}</div>;
}