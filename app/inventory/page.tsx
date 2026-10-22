"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatSol, solscanAccount, solscanTx } from "@/lib/format";
import type { Card } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { CardFace } from "@/components/cards";
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
    else setCards(null);
  }, [wallet.address]);

  const card = cards?.[selected] ?? null;
  const count = Math.max(12, cards?.length ?? 0);
  const slots = Array.from({ length: count }, (_, index) => cards?.[index] ?? null);

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
      setPrice("");
      load(wallet.address);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The listing failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (!card?.listingId || !wallet.address) return;
    setBusy(true);
    void api(`/v1/listings/${card.listingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ seller: wallet.address }),
    })
      .then(() => load(wallet.address as string))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Cancel failed."))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-pixel text-[10px] text-muted">YOUR WALLET</p>
        <h1 className="mt-2 font-pixel text-lg leading-8 text-lime">MY CARDS</h1>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6" aria-label="Your fee cards">
        {slots.map((slot, index) => (
          <button
            key={slot?.id ?? `slot-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            disabled={!slot}
            aria-pressed={selected === index}
            aria-label={slot ? `${slot.symbol} fee card ${slot.number}` : `Empty slot ${index + 1}`}
            className="aspect-square disabled:cursor-default"
          >
            <CardFace image={slot?.image} symbol={slot?.symbol} number={slot?.number} tier={slot?.tier} selected={Boolean(slot) && selected === index} />
          </button>
        ))}
      </div>
      <PixelFrame>
        {!wallet.address ? (
          <div className="flex flex-col items-start gap-4">
            <p className="font-pixel text-[11px] leading-6 text-cream">CONNECT PHANTOM TO SEE YOUR CARDS.</p>
            <PixelButton onClick={() => void wallet.connect()} aria-label="Connect Phantom">
              CONNECT PHANTOM
            </PixelButton>
          </div>
        ) : null}
        {wallet.address && cards && cards.length === 0 ? (
          <div className="flex flex-col items-start gap-4">
            <p className="font-pixel text-[11px] leading-6 text-cream">NO FEE CARDS IN THIS WALLET.</p>
            <PixelButton href="/packs">RIP A PACK</PixelButton>
          </div>
        ) : null}
        {card ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-56 w-40 shrink-0">
              <CardFace image={card.image} symbol={card.symbol} number={card.number} tier={card.tier} selected />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-[10px] leading-6 text-lime">
                {card.symbol} #{card.number}
                {card.tier ? ` · ${card.tier}` : ""}
              </p>
              <p className="mt-3 font-mono text-sm">Fee share {card.share}</p>
              <p className="font-mono text-sm">Paid out {formatSol(card.paidLamports)}</p>
              <p className="font-mono text-sm">Unpaid {formatSol(card.accruedLamports)}</p>
              <p className="mt-2 font-mono text-xs text-muted">{card.status === "listed" ? "LISTED" : "IN WALLET"}</p>
              <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm">
                <Link className="text-lime" href={`/coin/${card.mint}`}>
                  Coin
                </Link>
                {card.asset ? (
                  <a className="text-lime" href={solscanAccount(card.asset)}>
                    Card ↗
                  </a>
                ) : null}
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {(card.payouts ?? []).length === 0 ? <li className="font-mono text-sm text-muted">No payouts yet.</li> : null}
                {(card.payouts ?? []).map((payout) => (
                  <li key={payout.signature} className="font-mono text-sm">
                    <a className="text-lime" href={solscanTx(payout.signature)}>
                      {formatSol(payout.lamports)} Solscan ↗
                    </a>
                  </li>
                ))}
              </ul>
              {card.status === "listed" && card.listingId ? (
                <div className="mt-4">
                  <PixelButton kind="ghost" disabled={busy} aria-label="Cancel this listing" onClick={handleCancel}>
                    {busy ? "WORKING" : "CANCEL"}
                  </PixelButton>
                </div>
              ) : (
                <form
                  className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleList();
                  }}
                >
                  <Field label="LIST PRICE IN SOL">
                    <input className={inputClass} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required />
                  </Field>
                  <PixelButton type="submit" disabled={busy} aria-label="List this card">
                    {busy ? "WORKING" : "LIST"}
                  </PixelButton>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </PixelFrame>
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
    </div>
  );
};

export default InventoryPage;
