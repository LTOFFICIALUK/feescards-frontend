"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { solscanAccount } from "@/lib/format";
import type { Config } from "@/lib/types";
import { useWallet } from "@/lib/wallet";

const links = [
  { href: "/", label: "HOME" },
  { href: "/packs", label: "PACKS" },
  { href: "/market", label: "MARKET" },
  { href: "/inventory", label: "MY CARDS" },
  { href: "/launch", label: "LAUNCH" },
];

export const Shell = ({ children }: { children: ReactNode }) => {
  const path = usePathname();
  const wallet = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<Config>("/v1/config").then(setConfig).catch(() => setConfig(null));
  }, []);

  const handleConnect = () => {
    if (wallet.address) {
      void wallet.disconnect();
      return;
    }
    void wallet.connect().catch(() => undefined);
  };

  const handleCopy = async () => {
    if (!config?.feesMint) return;
    await navigator.clipboard.writeText(config.feesMint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-black text-cream">
      <header className="border-b-0 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="fees.cards home">
            <img src="/mark.svg" alt="" className="h-10 w-10" />
            <span className="font-pixel text-[11px] leading-5 text-cream sm:text-xs">fees.cards</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-3" aria-label="Primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-pixel text-[9px] leading-5 sm:text-[10px] ${path === link.href ? "text-lime" : "text-cream"}`}
                aria-current={path === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleConnect}
              className="bg-lime px-3 py-2 font-pixel text-[9px] text-ink shadow-[4px_4px_0_0_#6f9a22]"
              aria-label={wallet.address ? "Disconnect Phantom" : "Connect Phantom"}
            >
              {wallet.address ? `${wallet.address.slice(0, 4)} ${wallet.address.slice(-4)}` : "CONNECT"}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="mt-auto px-4 py-6 shadow-[0_-4px_0_0_#B8F34A] sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 font-mono text-sm text-muted">
            <a href="https://x.com/feesdotcards" className="text-lime" aria-label="fees.cards on X">
              x.com/feesdotcards
            </a>
            {config?.cursorWallet ? (
              <a href={solscanAccount(config.cursorWallet)} className="break-all text-cream" aria-label="fees.cards wallet on Solscan">
                fees.cards wallet {config.cursorWallet}
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-pixel text-[10px] text-lime">$FEES</span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!config?.feesMint}
              className="break-all bg-black px-3 py-3 text-left font-mono text-xs text-cream shadow-pixel disabled:opacity-80"
              aria-label={config?.feesMint ? "Copy the $FEES contract address" : "$FEES contract is pending"}
            >
              {config?.feesMint ? (copied ? "COPIED" : config.feesMint) : "Pending"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
