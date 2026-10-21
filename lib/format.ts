export const formatSol = (lamports: string | null | undefined) => {
  if (lamports === null || lamports === undefined) return null;
  const value = Number(lamports) / 1_000_000_000;
  if (!Number.isFinite(value)) return null;
  if (value === 0) return "0 SOL";
  if (value < 0.0001) return `${value.toFixed(6)} SOL`;
  if (value < 1) return `${value.toFixed(4)} SOL`;
  return `${value.toFixed(3)} SOL`;
};

export const formatUsd = (value: number | null) => {
  if (value === null) return null;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

export const solscanTx = (signature: string) => `https://solscan.io/tx/${signature}`;
export const solscanAccount = (address: string) => `https://solscan.io/account/${address}`;
export const solscanToken = (mint: string) => `https://solscan.io/token/${mint}`;

export const shortKey = (value: string) => `${value.slice(0, 4)}...${value.slice(-4)}`;
