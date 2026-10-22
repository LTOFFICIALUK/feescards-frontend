"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatSol, formatUsd, solscanToken } from "@/lib/format";
import type { Card } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { CardFace } from "@/components/cards";
import { PixelButton, PixelFrame } from "@/components/ui";

const MarketPage = () => {
  const wallet = useWallet();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api<Card[]>("/v1/market")
      .then(setCards)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The market could not load."));
  };

  useEffect(() => {
    load();
  }, []);

  const handleBuy = async (card: Card) => {
    if (!card.priceLamports) return;
    if (card.status !== "primary" && !card.listingId) return;
    setBusy(card.id);
    setError(null);
    try {
      const buyer = wallet.address ?? (await wallet.connect());
      const path = card.status === "primary" ? `/v1/cards/${card.id}/buy` : `/v1/listings/${card.listingId}/buy`;
      const prepared = await api<{ lamports: string; escrow: string }>(path, {
        method: "POST",
        body: JSON.stringify({ buyer }),
      });
      const signature = await wallet.pay(prepared.escrow, prepared.lamports);
      const confirmPath = card.status === "primary" ? `/v1/cards/${card.id}/buy/confirm` : `/v1/listings/${card.listingId}/buy/confirm`;
      await api(confirmPath, { method: "POST", body: JSON.stringify({ buyer, signature }) });
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The buy failed.");
    } finally {
      setBusy(null);
    }
  };

  const primary = (cards ?? []).filter((card) => card.status === "primary");
  const listed = (cards ?? []).filter((card) => card.status !== "primary");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-pixel text-[10px] text-muted">BUY A SHARE</p>
        <h1 className="mt-2 font-pixel text-lg leading-8 text-lime">MARKET</h1>
        <p className="mt-3 max-w-xl font-mono text-sm leading-6 text-cream">
          Primary cards pay the launcher minus 10 percent. Listed cards pay the seller minus 2.5 percent.
        </p>
      </div>
      {cards && cards.length === 0 ? (
        <PixelFrame>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {[0, 1, 2].map((item) => (
              <div key={item} className="aspect-square">
                <CardFace />
              </div>
            ))}
          </div>
          <p className="mt-4 font-pixel text-[11px] leading-6 text-cream">NO CARDS ARE FOR SALE YET.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <PixelButton href="/launch">LAUNCH A COIN</PixelButton>
            <PixelButton href="/packs" kind="ghost">
              RIP A PACK
            </PixelButton>
          </div>
        </PixelFrame>
      ) : null}
      {cards === null && !error ? <p className="font-pixel text-[11px] text-muted">LOADING</p> : null}
      <Shelf title="PRIMARY" cards={primary} busy={busy} onBuy={handleBuy} />
      <Shelf title="LISTED" cards={listed} busy={busy} onBuy={handleBuy} empty={cards !== null && cards.length > 0 ? "NO LISTINGS YET." : null} />
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
    </div>
  );
};

const Shelf = ({
  title,
  cards,
  busy,
  onBuy,
  empty,
}: {
  title: string;
  cards: Card[];
  busy: string | null;
  onBuy: (card: Card) => void;
  empty?: string | null;
}) => {
  if (cards.length === 0 && !empty) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-pixel text-[11px] text-lime">{title}</h2>
      {cards.length === 0 && empty ? <p className="font-mono text-sm text-muted">{empty}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <PixelFrame key={card.id}>
            <div className="mb-3 aspect-[4/5]">
              <CardFace image={card.image} symbol={card.symbol} number={card.number} tier={card.tier} />
            </div>
            <Link href={`/coin/${card.mint}`} className="font-pixel text-[10px] leading-6 text-lime">
              {card.coinName} · {card.symbol}
              {card.tier ? ` · ${card.tier}` : ""}
            </Link>
            <p className="mt-2 font-mono text-sm text-cream">Fee share {card.share}</p>
            {card.dayFeesLamports !== null ? <p className="font-mono text-sm">24h creator fees {formatSol(card.dayFeesLamports)}</p> : null}
            <p className="font-mono text-sm">Paid out {formatSol(card.paidLamports)}</p>
            <p className="font-mono text-sm">Unpaid {formatSol(card.accruedLamports)}</p>
            {card.marketCapLamports ? <p className="font-mono text-sm text-muted">Market cap {formatSol(card.marketCapLamports)}</p> : null}
            {formatUsd(card.volumeUsd) ? <p className="font-mono text-sm text-muted">Volume {formatUsd(card.volumeUsd)}</p> : null}
            <p className="mt-2 font-pixel text-[10px] text-cream">{card.priceLamports ? formatSol(card.priceLamports) : "Pending"}</p>
            {card.isSeed ? <p className="mt-2 font-mono text-xs text-muted">Launched by fees.cards</p> : null}
            <div className="mt-3 flex flex-wrap gap-3">
              <PixelButton onClick={() => onBuy(card)} disabled={busy === card.id || !card.priceLamports} aria-label={`Buy ${card.symbol} card ${card.number}`}>
                {busy === card.id ? "WORKING" : "BUY"}
              </PixelButton>
              <a className="self-center font-mono text-sm text-lime" href={solscanToken(card.mint)}>
                Solscan ↗
              </a>
            </div>
          </PixelFrame>
        ))}
      </div>
    </section>
  );
};

export default MarketPage;
