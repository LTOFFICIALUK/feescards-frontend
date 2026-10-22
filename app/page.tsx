"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatSol, solscanAccount, solscanToken, solscanTx } from "@/lib/format";
import type { Card, Payout } from "@/lib/types";
import { CardFace } from "@/components/cards";
import { PixelButton, PixelFrame } from "@/components/ui";

const steps = [
  { title: "LAUNCH A COIN", body: "A new coin wallet holds the creator fees. You never hold its key." },
  { title: "YOU RIP OR BUY", body: "Rip a pack or buy a card on the market. The card starts in escrow." },
  { title: "THE CARD PAYS", body: "Your card pays its share in SOL. Every payout is on Solscan." },
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

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-start gap-8 lg:grid-cols-2">
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
            {slots.map((slot, index) => (
              <button
                key={slot?.id ?? `slot-${index}`}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
                aria-label={slot ? `${slot.symbol} fee card ${slot.number}` : `Empty fee card slot ${index + 1}`}
                className="aspect-square"
              >
                <CardFace
                  image={slot?.image}
                  symbol={slot?.symbol}
                  number={slot?.number}
                  tier={slot?.tier}
                  selected={selected === index}
                />
              </button>
            ))}
          </div>
          <PixelFrame>
            {card ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="h-36 w-28 shrink-0">
                  <CardFace image={card.image} symbol={card.symbol} number={card.number} tier={card.tier} selected />
                </div>
                <div>
                  <p className="font-pixel text-[10px] leading-6 text-lime">
                    {card.symbol}
                    {card.tier ? ` · ${card.tier}` : ""}
                  </p>
                  <p className="mt-3 font-mono text-sm leading-6 text-cream">Fee share {card.share}</p>
                  <p className="font-mono text-sm leading-6 text-cream">Paid out {formatSol(card.paidLamports)}</p>
                  <p className="font-mono text-sm leading-6 text-cream">Unpaid {formatSol(card.accruedLamports)}</p>
                  <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm">
                    <Link className="text-lime" href={`/coin/${card.mint}`}>
                      Coin
                    </Link>
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
                </div>
              </div>
            ) : (
              <div>
                <p className="font-pixel text-[10px] leading-6 text-lime">FEE CARD</p>
                <p className="mt-3 font-mono text-sm leading-6 text-cream">
                  One card holds an equal share of that coin&apos;s creator fees. The holder is paid in SOL.
                </p>
                <p className="mt-2 font-mono text-sm leading-6 text-muted">Live cards replace these slots as soon as a coin launches.</p>
              </div>
            )}
          </PixelFrame>
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
