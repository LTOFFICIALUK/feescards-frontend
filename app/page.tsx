"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatSol, solscanAccount, solscanToken, solscanTx } from "@/lib/format";
import type { Card, Payout } from "@/lib/types";
import { PixelButton, PixelFrame } from "@/components/ui";

const steps = [
  { title: "LAUNCH A COIN", body: "A new coin wallet holds the creator fees." },
  { title: "YOU RIP OR BUY", body: "Rip a pack or buy a card on the market." },
  { title: "THE CARD PAYS", body: "Your card pays its share in SOL." },
];

const HomePage = () => {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ cards: Card[]; payouts: Payout[] }>("/v1/home")
      .then((body) => {
        setCards(body.cards);
        setPayouts(body.payouts);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The board could not load."));
  }, []);

  const slots = Array.from({ length: 12 }, (_, index) => cards?.[index] ?? null);
  const card = cards?.[selected] ?? null;
  const paid = card ? formatSol(card.paidLamports) : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <p className="font-pixel text-[10px] leading-6 text-lime">NEW ITEM TYPE: FEE CARD</p>
          <h1 className="font-pixel text-[22px] leading-[1.45] text-cream sm:text-[34px]">
            CARDS THAT
            <br />
            <span className="text-lime">PAY YOU.</span>
          </h1>
          <p className="max-w-md font-mono text-base leading-7 text-cream">
            Every coin&apos;s creator fees are split into cards. You hold the card. You get the SOL.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PixelButton href="/packs">RIP A PACK</PixelButton>
            <PixelButton href="/launch" kind="ghost">
              LAUNCH A COIN
            </PixelButton>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3" aria-label="Fee card inventory">
            {slots.map((slot, index) =>
              slot ? (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`${slot.symbol} fee card ${slot.number}`}
                  className={`aspect-square bg-ink p-1 ${selected === index ? "shadow-pixel" : "shadow-pixel-mute"}`}
                >
                  {slot.image ? <img src={slot.image} alt="" className="h-full w-full object-cover" /> : null}
                </button>
              ) : (
                <div key={`empty-${index}`} className="aspect-square bg-black shadow-pixel-mute" aria-hidden />
              ),
            )}
          </div>
          {card ? (
            <PixelFrame>
              <p className="font-pixel text-[10px] leading-6 text-lime">
                {card.symbol}
                {card.tier ? ` · ${card.tier}` : ""}
              </p>
              <p className="mt-3 font-mono text-sm leading-6 text-cream">Fee share {card.share}</p>
              {paid ? <p className="font-mono text-sm leading-6 text-cream">Paid out {paid}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm">
                <a className="text-lime" href={solscanToken(card.mint)} aria-label={`${card.symbol} on Solscan`}>
                  Solscan ↗
                </a>
                {card.asset ? (
                  <a className="text-lime" href={solscanAccount(card.asset)} aria-label="Card account on Solscan">
                    Card ↗
                  </a>
                ) : null}
              </div>
              {card.isSeed ? <p className="mt-3 font-mono text-xs text-muted">Launched by fees.cards</p> : null}
            </PixelFrame>
          ) : null}
          <PixelFrame>
            {payouts && payouts.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {payouts.map((payout) => (
                  <li key={payout.id} className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm">
                    <span>
                      {payout.symbol} #{payout.number} {formatSol(payout.lamports)}
                    </span>
                    <a className="text-lime" href={solscanTx(payout.signature)} aria-label="Payout on Solscan">
                      Solscan ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-start gap-4">
                <p className="font-pixel text-[11px] leading-6 text-cream">THE FIRST PAYOUT LANDS HERE.</p>
                <PixelButton href="/packs">RIP THE FIRST PACK</PixelButton>
              </div>
            )}
            {error ? <p className="mt-3 font-mono text-sm text-lime">{error}</p> : null}
          </PixelFrame>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3" aria-label="How it works">
        {steps.map((step, index) => (
          <PixelFrame key={step.title}>
            <p className="font-pixel text-[10px] text-muted">0{index + 1}</p>
            <h2 className="mt-3 font-pixel text-[11px] leading-6 text-lime">{step.title}</h2>
            <p className="mt-3 font-mono text-sm leading-6 text-cream">{step.body}</p>
          </PixelFrame>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
