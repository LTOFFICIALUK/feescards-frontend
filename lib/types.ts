export type Card = {
  id: string;
  name: string;
  symbol: string;
  coinName: string;
  mint: string;
  number: number;
  count: number;
  share: string;
  tier: "CHASE" | "RARE" | "COMMON" | null;
  image: string | null;
  asset: string | null;
  paidLamports: string;
  accruedLamports: string;
  status: string;
  isSeed: boolean;
  priceLamports: string | null;
  coinWallet: string;
  owner: string | null;
  dayFeesLamports: string | null;
  marketCapLamports: string | null;
  volumeUsd: number | null;
  listingId: string | null;
  payouts?: { signature: string; lamports: string; at: string }[];
};

export type Payout = {
  id: string;
  signature: string;
  lamports: string;
  holder: string;
  symbol: string;
  number: number;
  mint: string;
  at: string;
};

export type Config = {
  cursorWallet: string;
  escrowWallet: string;
  feesMint: string | null;
  packs: { tier: "quarter" | "half" | "one"; lamports: string; cards: number }[];
};
