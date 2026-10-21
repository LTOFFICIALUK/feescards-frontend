"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatSol, solscanTx } from "@/lib/format";
import type { Card } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { Field, PixelButton, PixelFrame, inputClass } from "@/components/ui";

const InventoryPage = () => {
  const wallet = useWallet();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = (address: string) => {
    api<Card[]>(`/v1/inventory/${address}`)
      .then((rows) => {
        setCards(rows);
        setSelected(0);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Inventory could not load."));
  };

  useEffect(() => {
    if (wallet.address) load(wallet.address);
  }, [wallet.address]);

  const card = cards?.[selected] ?? null;
  const slots = Array.from({ length: Math.max(12, cards?.length ?? 0) }, (_, index) => cards?.[index] ?? null);

  const handleList = async () => {
    if (!card || !wallet.address) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await api<{ id: string; transaction: string }>("/v1/listings", {
        method: "POST",
        body: JSON.stringify({ cardId: card.id, seller: wallet.address, priceSol: price }),
      });
      const signature = await wallet.sendRaw(prepared.transaction);
      await api(`/v1/listings/${prepared.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ seller: wallet.address, signature }),
      });
      load(wallet.address);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The listing failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-lg leading-8 text-lime">MY CARDS</h1>
      {!wallet.address ? (
        <PixelButton onClick={() => void wallet.connect()} aria-label="Connect Phantom">
          CONNECT PHANTOM
        </PixelButton>
      ) : null}
      {wallet.address && cards && cards.length === 0 ? <p className="font-mono text-sm">NO FEE CARDS IN THIS WALLET.</p> : null}
      {wallet.address ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6" aria-label="Your fee cards">
          {slots.map((slot, index) =>
            slot ? (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelected(index)}
                className={`aspect-square bg-ink p-1 ${selected === index ? "shadow-pixel" : "shadow-pixel-mute"}`}
                aria-label={`${slot.symbol} fee card ${slot.number}`}
              >
                {slot.image ? <img src={slot.image} alt="" className="h-full w-full object-cover" /> : null}
              </button>
            ) : (
              <div key={`empty-${index}`} className="aspect-square bg-black shadow-pixel-mute" aria-hidden />
            ),
          )}
        </div>
      ) : null}
      {card ? (
        <PixelFrame>
          <p className="font-pixel text-[10px] leading-6 text-lime">
            {card.symbol} #{card.number}
            {card.tier ? ` · ${card.tier}` : ""}
          </p>
          <p className="mt-3 font-mono text-sm">Paid out {formatSol(card.paidLamports)}</p>
          <p className="font-mono text-sm">Unpaid {formatSol(card.accruedLamports)}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {(card.payouts ?? []).map((payout) => (
              <li key={payout.signature} className="font-mono text-sm">
                <a className="text-lime" href={solscanTx(payout.signature)}>
                  {formatSol(payout.lamports)} Solscan ↗
                </a>
              </li>
            ))}
          </ul>
          {card.status === "listed" && card.listingId ? (
            <PixelButton
              kind="ghost"
              disabled={busy}
              aria-label="Cancel this listing"
              onClick={() => {
                setBusy(true);
                void api(`/v1/listings/${card.listingId}/cancel`, {
                  method: "POST",
                  body: JSON.stringify({ seller: wallet.address }),
                })
                  .then(() => wallet.address && load(wallet.address))
                  .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Cancel failed."))
                  .finally(() => setBusy(false));
              }}
            >
              CANCEL
            </PixelButton>
          ) : null}
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void handleList();
            }}
          >
            <Field label="LIST PRICE IN SOL">
              <input className={inputClass} value={price} onChange={(event) => setPrice(event.target.value)} required />
            </Field>
            <PixelButton type="submit" disabled={busy} aria-label="List this card">
              {busy ? "WORKING" : "LIST"}
            </PixelButton>
          </form>
        </PixelFrame>
      ) : null}
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
    </div>
  );
};

export default InventoryPage;
