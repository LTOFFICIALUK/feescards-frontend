"use client";

import { Buffer } from "buffer";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatSol, solscanToken, solscanTx } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { Field, PixelButton, PixelFrame, inputClass } from "@/components/ui";

const counts = [10, 25, 50] as const;

const LaunchPage = () => {
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [cardCount, setCardCount] = useState<(typeof counts)[number]>(10);
  const [price, setPrice] = useState("");
  const [devBuy, setDevBuy] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mint, setMint] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLaunch = async () => {
    setError(null);
    setBusy(true);
    try {
      const address = wallet.address ?? (await wallet.connect());
      if (!file) throw new Error("Add an image.");
      const imageBase64 = await file.arrayBuffer().then((buffer) => Buffer.from(buffer).toString("base64"));
      const prepared = await api<{ id: string; coinWallet: string; lamports: string; mint: string }>("/v1/launches", {
        method: "POST",
        body: JSON.stringify({
          launcher: address,
          name,
          symbol,
          description,
          twitter: twitter || null,
          imageBase64,
          cardCount,
          cardPriceSol: price,
          devBuySol: devBuy || "0",
        }),
      });
      setStatus(`You send ${formatSol(prepared.lamports)} to the coin wallet.`);
      const payment = await wallet.pay(prepared.coinWallet, prepared.lamports);
      setStatus("Creating the coin and the cards.");
      await api(`/v1/launches/${prepared.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ signature: payment, launcher: address }),
      });
      const result = await pollLaunch(prepared.id);
      setMint(result.mint);
      setSignature(result.createSignature);
      setStatus(result.status === "live" ? "The coin is live." : result.error || "The launch failed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The launch failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="font-pixel text-lg leading-8 text-lime">LAUNCH A COIN</h1>
      <p className="font-mono text-sm leading-6 text-cream">
        You sign one SOL transfer. The coin wallet is new. You never hold its key.
      </p>
      <PixelFrame>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLaunch();
          }}
        >
          <Field label="NAME">
            <input className={inputClass} value={name} maxLength={32} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field label="TICKER">
            <input className={inputClass} value={symbol} maxLength={13} onChange={(event) => setSymbol(event.target.value.toUpperCase())} required />
          </Field>
          <Field label="IMAGE">
            <input
              className="font-mono text-sm text-cream"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </Field>
          <Field label="DESCRIPTION">
            <textarea className={inputClass} value={description} maxLength={400} onChange={(event) => setDescription(event.target.value)} required />
          </Field>
          <Field label="X LINK">
            <input className={inputClass} value={twitter} placeholder="https://x.com/" onChange={(event) => setTwitter(event.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Number of cards">
            {counts.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setCardCount(count)}
                className={`px-3 py-3 font-pixel text-[10px] ${cardCount === count ? "bg-lime text-ink" : "bg-black text-lime shadow-pixel"}`}
                aria-pressed={cardCount === count}
              >
                {count} CARDS
              </button>
            ))}
          </div>
          <Field label="PRICE PER CARD IN SOL">
            <input className={inputClass} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </Field>
          <Field label="DEV BUY IN SOL">
            <input className={inputClass} inputMode="decimal" value={devBuy} placeholder="0" onChange={(event) => setDevBuy(event.target.value)} />
          </Field>
          <PixelButton type="submit" disabled={busy} aria-label="Launch this coin">
            {busy ? "WORKING" : "LAUNCH A COIN"}
          </PixelButton>
        </form>
      </PixelFrame>
      {status ? <p className="font-mono text-sm text-cream">{status}</p> : null}
      {error ? <p className="font-mono text-sm text-lime">{error}</p> : null}
      {mint ? (
        <a className="font-mono text-sm text-lime" href={solscanToken(mint)}>
          Coin on Solscan ↗
        </a>
      ) : null}
      {signature ? (
        <a className="font-mono text-sm text-lime" href={solscanTx(signature)}>
          Create transaction ↗
        </a>
      ) : null}
    </div>
  );
};

const pollLaunch = async (id: string) => {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const row = await api<{ status: string; mint: string; error: string | null; createSignature: string | null }>(`/v1/launches/${id}`);
    if (row.status === "live" || row.status === "failed") return row;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("The launch is still running. Check back in a minute.");
};

export default LaunchPage;
