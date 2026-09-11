"use client";

import { useRef, useState } from "react";
import { Copy, Share2, X } from "lucide-react";

export default function RaffleShareButton({ title, slug }: { title: string; slug: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [sharing, setSharing] = useState(false);
  const text = `¡Participa en la rifa ${title}! Elige tus números en RIFLY.`;

  async function share() {
    const link = new URL(`/rifa/${encodeURIComponent(slug)}`, window.location.origin).href;
    setUrl(link);
    setNotice("");
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({ title: `${title} | RIFLY`, text, url: link });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        setSharing(false);
      }
    }
    dialog.current?.showModal();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Enlace copiado.");
    } catch {
      input.current?.focus();
      input.current?.select();
      setNotice("Seleccionamos el enlace. Cópialo para compartirlo.");
    }
  }

  const networks = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  ];

  return <>
    <button type="button" onClick={share} disabled={sharing} className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 disabled:opacity-50" aria-label="Compartir rifa"><Share2 className="h-4 w-4" /></button>
    <dialog ref={dialog} aria-labelledby="share-title" className="fixed inset-0 m-auto w-[calc(100%-2.5rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-[#101828] shadow-xl backdrop:bg-slate-950/40" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="flex items-center justify-between gap-4"><h2 id="share-title" className="text-3xl font-bold tracking-[-.05em]">Compartir rifa</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Cerrar" className="rounded-full p-2 text-slate-500"><X className="h-5 w-5" /></button></div>
      <p className="mt-3 break-words sans text-sm text-slate-500">Invita a tus amigos a participar en {title}.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sans">{networks.map((network) => <a key={network.name} href={network.href} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#eeeaff] px-4 py-3 text-center text-sm font-bold text-[#5a38e8]">{network.name}</a>)}</div>
      <label htmlFor="raffle-share-url" className="mt-6 block sans text-xs font-bold text-slate-500">Enlace de la rifa</label>
      <input ref={input} id="raffle-share-url" value={url} readOnly onFocus={(event) => event.target.select()} className="mt-2 w-full rounded-xl border border-slate-200 p-3 sans text-sm" />
      <button type="button" onClick={copyLink} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 sans text-sm font-bold text-white"><Copy className="h-4 w-4" />Copiar enlace</button>
      <p role="status" className="mt-3 sans text-sm text-slate-600">{notice}</p>
    </dialog>
  </>;
}
