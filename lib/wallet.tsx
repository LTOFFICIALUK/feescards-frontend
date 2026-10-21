"use client";

import { Buffer } from "buffer";
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Phantom = {
  isPhantom?: boolean;
  publicKey: { toString(): string } | null;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<{ signature: string }>;
};

type WalletValue = {
  address: string | null;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  pay: (to: string, lamports: string) => Promise<string>;
  sendRaw: (base64: string) => Promise<string>;
};

const WalletContext = createContext<WalletValue | null>(null);

const phantom = () => {
  const provider = (window as unknown as { phantom?: { solana?: Phantom } }).phantom?.solana;
  if (!provider?.isPhantom) throw new Error("Install Phantom, then connect.");
  return provider;
};

const connection = () => new Connection("https://api.mainnet-beta.solana.com", "confirmed");

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);

  const value = useMemo<WalletValue>(
    () => ({
      address,
      connect: async () => {
        const result = await phantom().connect();
        const next = result.publicKey.toString();
        setAddress(next);
        return next;
      },
      disconnect: async () => {
        await phantom().disconnect();
        setAddress(null);
      },
      pay: async (to: string, lamports: string) => {
        const provider = phantom();
        const from = provider.publicKey?.toString() ?? address;
        if (!from) throw new Error("Connect Phantom first.");
        const tx = new Transaction();
        tx.feePayer = new PublicKey(from);
        tx.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(from),
            toPubkey: new PublicKey(to),
            lamports: Number(lamports),
          }),
        );
        const latest = await connection().getLatestBlockhash("confirmed");
        tx.recentBlockhash = latest.blockhash;
        const { signature } = await provider.signAndSendTransaction(tx);
        await connection().confirmTransaction({ signature, ...latest }, "confirmed");
        return signature;
      },
      sendRaw: async (base64: string) => {
        const provider = phantom();
        const bytes = Buffer.from(base64, "base64");
        let tx: Transaction | VersionedTransaction;
        try {
          tx = Transaction.from(bytes);
        } catch {
          tx = VersionedTransaction.deserialize(bytes);
        }
        const { signature } = await provider.signAndSendTransaction(tx);
        const latest = await connection().getLatestBlockhash("confirmed");
        await connection().confirmTransaction({ signature, ...latest }, "confirmed");
        return signature;
      },
    }),
    [address],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const value = useContext(WalletContext);
  if (!value) throw new Error("Wallet missing.");
  return value;
};
