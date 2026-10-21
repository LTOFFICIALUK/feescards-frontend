"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatSol, formatUsd, solscanToken } from "@/lib/format";
import type { Card } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
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
      const prepared = await api<{ lamports: string; escrow: string; id?: string }>(path, {
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-lg leading-8 text-lime">MARKET</h1>
      {cards && cards.length === 0 ? <p className="font-pixel text-[11px] leading-6">NO CARDS ARE FOR SALE YET.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(cards ?? []).map((card) => (
          <PixelFrame key={card.id}>
            {card.image ? <img src={card.image} alt="" className="mb-3 h-40 w-full object-cover" /> : null}
            <Link href={`/coin/${card.mint}`} className="font-pixel text-[10px] leading-6 text-lime">
              {card.symbol}
              {card.tier ? ` · ${card.tier}` : ""}
            </Link>
            <p className="mt-2 font-mono text-sm text-cream">Fee share {card.share}</p>
            {card.dayFeesLamports !== null ? <p className="font-mono text-sm">24h creator fees {formatSol(card.dayFeesLamports)}</p> : null}
            <p className="font-mono text-sm">Paid out {formatSol(card.paidLamports)}</p>
            <p className="font-mono text-sm">Unpaid {formatSol(card.accruedLamports)}</p>
            {card.marketCapLamports ? <p className="font-mono text-sm text-muted">Market cap {formatSol(card.marketCapLamports)}</p> : null}
            {formatUsd(card.volumeUsd) ? <p className="font-mono text-sm text-muted">Volume {formatUsd(card.volumeUsd)}</p> : null}
            <p className="mt-2 font-pixel text-[10px] text-cream">{formatSol(card.priceLamports)}</p>
            {card.isSeed ? <p className="mt-2 font-mono text-xs text-muted">Launched by fees.cards</p> : null}
            <div className="mt-3 flex flex-wrap gap-3">
              <PixelButton onClick={() => void handleBuy(card)} disabled={busy === card.id} aria-label={`Buy ${card.symbol} card ${card.number}`}>
                {busy === card.id ? "WORKING" : "BUY"}
              </PixelButton>
              <a className="self-center font-mono text-sm text-lime" href={solscanToken(card.mint)}>
                Solscan ↗
              </a>
            </div>
          </PixelFrame>
        ))}
      </div>
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
    </div>
  );
};

export default MarketPage;
