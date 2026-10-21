"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatSol } from "@/lib/format";
import type { Card, Config } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { PixelButton, PixelFrame } from "@/components/ui";

const labels: Record<string, string> = { quarter: "0.25 SOL", half: "0.5 SOL", one: "1 SOL" };

const PacksPage = () => {
  const wallet = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api<Config>("/v1/config").then(setConfig).catch(() => setConfig(null));
  }, []);

  const handleRip = async (tier: "quarter" | "half" | "one") => {
    setError(null);
    setCards([]);
    setBusy(tier);
    try {
      const buyer = wallet.address ?? (await wallet.connect());
      const prepared = await api<{ id: string; lamports: string; escrow: string }>("/v1/packs", {
        method: "POST",
        body: JSON.stringify({ buyer, tier }),
      });
      const signature = await wallet.pay(prepared.escrow, prepared.lamports);
      const done = await api<{ cards: Card[] }>(`/v1/packs/${prepared.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ buyer, signature }),
      });
      setCards(done.cards);
      setIndex(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The pack failed.");
    } finally {
      setBusy(null);
    }
  };

  const card = cards[index];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-pixel text-lg leading-8 text-lime">RIP A PACK</h1>
      <p className="max-w-xl font-mono text-sm leading-6 text-cream">Five cards from primary inventory. The prices inside the pack fit the tier.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {(config?.packs ?? []).map((pack) => (
          <PixelFrame key={pack.tier}>
            <p className="font-pixel text-sm text-lime">{labels[pack.tier]}</p>
            <p className="mt-3 font-mono text-sm text-cream">{pack.cards} cards</p>
            <p className="font-mono text-sm text-muted">{formatSol(pack.lamports)}</p>
            <div className="mt-4">
              <PixelButton onClick={() => void handleRip(pack.tier)} disabled={busy !== null} aria-label={`Rip a ${labels[pack.tier]} pack`}>
                {busy === pack.tier ? "WORKING" : "RIP"}
              </PixelButton>
            </div>
          </PixelFrame>
        ))}
      </div>
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
      {card ? (
        <PixelFrame>
          <p className="font-pixel text-[10px] text-muted">
            CARD {index + 1} / {cards.length}
          </p>
          {card.image ? <img src={card.image} alt="" className="mt-4 h-64 w-48 object-cover shadow-pixel" /> : null}
          <h2 className="mt-4 font-pixel text-xs leading-6 text-lime">
            {card.symbol}
            {card.tier ? ` · ${card.tier}` : ""}
          </h2>
          <p className="mt-2 font-mono text-sm text-cream">Fee share {card.share}</p>
          <div className="mt-4">
            {index < cards.length - 1 ? (
              <PixelButton onClick={() => setIndex(index + 1)} aria-label="Show the next card">
                NEXT CARD
              </PixelButton>
            ) : (
              <PixelButton href="/inventory">MY CARDS</PixelButton>
            )}
          </div>
        </PixelFrame>
      ) : null}
    </div>
  );
};

export default PacksPage;
