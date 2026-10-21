"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatSol, formatUsd, solscanAccount, solscanToken, solscanTx } from "@/lib/format";
import type { Card } from "@/lib/types";
import { PixelFrame } from "@/components/ui";

type Coin = {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  twitter: string | null;
  image: string;
  coinWallet: string;
  cardCount: number;
  isSeed: boolean;
  graduated: boolean;
  createSignature: string | null;
  marketCapLamports: string | null;
  volumeUsd: number | null;
  vaultLamports: string | null;
  dayFeesLamports: string | null;
  cards: Card[];
  payouts: { signature: string; lamports: string; holder: string; number: number; at: string }[];
};

const CoinPage = () => {
  const params = useParams<{ mint: string }>();
  const [coin, setCoin] = useState<Coin | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<Coin>(`/v1/coins/${params.mint}`)
      .then(setCoin)
      .catch(() => setMissing(true));
  }, [params.mint]);

  if (missing) return <p className="font-pixel text-xs">That coin is not live.</p>;
  if (!coin) return <p className="font-pixel text-xs text-muted">LOADING</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <img src={coin.image} alt="" className="h-28 w-28 object-cover shadow-pixel" />
        <div>
          <h1 className="font-pixel text-lg leading-8 text-lime">{coin.symbol}</h1>
          <p className="font-mono text-sm text-cream">{coin.name}</p>
          <p className="mt-2 max-w-xl font-mono text-sm leading-6">{coin.description}</p>
          {coin.isSeed ? <p className="mt-2 font-mono text-xs text-muted">Launched by fees.cards</p> : null}
        </div>
      </div>
      <PixelFrame>
        <ul className="flex flex-col gap-2 font-mono text-sm">
          {coin.marketCapLamports ? <li>Market cap {formatSol(coin.marketCapLamports)}</li> : null}
          {formatUsd(coin.volumeUsd) ? <li>Volume {formatUsd(coin.volumeUsd)}</li> : null}
          {coin.dayFeesLamports !== null ? <li>24h creator fees {formatSol(coin.dayFeesLamports)}</li> : null}
          {coin.vaultLamports !== null ? <li>In the vault {formatSol(coin.vaultLamports)}</li> : null}
          <li>Cards {coin.cardCount}</li>
          {coin.graduated ? <li>Graduated</li> : null}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm">
          <a className="text-lime" href={solscanToken(coin.mint)}>
            Mint ↗
          </a>
          <a className="text-lime" href={solscanAccount(coin.coinWallet)}>
            Coin wallet ↗
          </a>
          {coin.createSignature ? (
            <a className="text-lime" href={solscanTx(coin.createSignature)}>
              Create ↗
            </a>
          ) : null}
          {coin.twitter ? (
            <a className="text-lime" href={coin.twitter}>
              X ↗
            </a>
          ) : null}
        </div>
      </PixelFrame>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {coin.cards.map((card) => (
          <div key={card.id} className="aspect-square bg-ink p-1 shadow-pixel-mute">
            {card.image ? <img src={card.image} alt={`${card.symbol} fee card ${card.number}`} className="h-full w-full object-cover" /> : null}
          </div>
        ))}
      </div>
      {coin.payouts.length ? (
        <ul className="flex flex-col gap-2">
          {coin.payouts.map((payout) => (
            <li key={payout.signature} className="font-mono text-sm">
              <a className="text-lime" href={solscanTx(payout.signature)}>
                #{payout.number} {formatSol(payout.lamports)} Solscan ↗
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-pixel text-[11px] leading-6">THE FIRST PAYOUT LANDS HERE.</p>
      )}
    </div>
  );
};

export default CoinPage;
