"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatSol } from "@/lib/format";
import type { Card, Config } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { CardFace, PackArt } from "@/components/cards";
import { PixelButton, PixelFrame } from "@/components/ui";

const labels: Record<string, string> = { quarter: "0.25 SOL", half: "0.5 SOL", one: "1 SOL" };

const PacksPage = () => {
  const wallet = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api<Config>("/v1/config").then(setConfig).catch(() => setConfig(null));
    api<Card[]>("/v1/market")
      .then((rows) => setStock(rows.filter((row) => row.status === "primary").length))
      .catch(() => setStock(null));
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
  const packs = config?.packs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-pixel text-[10px] text-muted">PRIMARY INVENTORY</p>
        <h1 className="mt-2 font-pixel text-lg leading-8 text-lime">RIP A PACK</h1>
        <p className="mt-3 max-w-xl font-mono text-sm leading-6 text-cream">
          Five cards from primary inventory. The prices inside the pack fit the tier. Launchers get their card price minus 10 percent.
        </p>
      </div>
      {stock === 0 ? (
        <PixelFrame>
          <p className="font-pixel text-[11px] leading-6 text-cream">THE BOX IS EMPTY.</p>
          <p className="mt-3 font-mono text-sm leading-6 text-muted">Packs open when primary cards are for sale.</p>
          <div className="mt-4">
            <PixelButton href="/launch" kind="ghost">
              LAUNCH A COIN
            </PixelButton>
          </div>
        </PixelFrame>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {packs.length === 0
          ? [0, 1, 2].map((item) => (
              <PixelFrame key={item}>
                <PackArt />
                <p className="mt-4 font-pixel text-[10px] text-muted">LOADING</p>
              </PixelFrame>
            ))
          : packs.map((pack) => (
              <PixelFrame key={pack.tier}>
                <PackArt />
                <p className="mt-4 font-pixel text-sm text-lime">{labels[pack.tier]}</p>
                <p className="mt-3 font-mono text-sm text-cream">{pack.cards} cards</p>
                <p className="font-mono text-sm text-muted">{formatSol(pack.lamports)}</p>
                <div className="mt-4">
                  <PixelButton onClick={() => void handleRip(pack.tier)} disabled={busy !== null || stock === 0} aria-label={`Rip a ${labels[pack.tier]} pack`}>
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
          <div className="mt-4 h-72 w-52">
            <CardFace image={card.image} symbol={card.symbol} number={card.number} tier={card.tier} selected />
          </div>
          <h2 className="mt-4 font-pixel text-xs leading-6 text-lime">
            {card.symbol}
            {card.tier ? ` · ${card.tier}` : ""}
          </h2>
          <p className="mt-2 font-mono text-sm text-cream">Fee share {card.share}</p>
          <p className="font-mono text-sm text-cream">Paid out {formatSol(card.paidLamports)}</p>
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
