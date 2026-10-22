type FaceProps = {
  image?: string | null;
  symbol?: string | null;
  number?: number | null;
  tier?: string | null;
  selected?: boolean;
};

export const CardFace = ({ image, symbol, number, tier, selected = false }: FaceProps) => (
  <span className={`flex h-full w-full flex-col bg-black p-1 ${selected ? "bg-lime" : "shadow-pixel"}`}>
    <span className="relative flex min-h-0 flex-1 items-center justify-center bg-ink">
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <img src="/mark.svg" alt="" className="h-8 w-8 sm:h-10 sm:w-10" />
      )}
      {tier ? (
        <span className="absolute left-0 top-0 bg-lime px-1 font-pixel text-[7px] leading-4 text-ink">{tier}</span>
      ) : null}
    </span>
    <span className="mt-1 flex items-center justify-between gap-1 bg-lime px-1">
      <span className="truncate font-pixel text-[7px] leading-4 text-ink">{symbol || "FEE"}</span>
      <span className="shrink-0 font-pixel text-[7px] leading-4 text-ink">{number ? `#${number}` : "CARD"}</span>
    </span>
  </span>
);

export const PackArt = () => (
  <span className="relative mx-auto block h-40 w-32 overflow-hidden" aria-hidden>
    <span className="absolute left-0 top-3 h-32 w-24 rotate-[-8deg] opacity-80">
      <CardFace />
    </span>
    <span className="absolute left-3 top-1 h-32 w-24 rotate-[6deg]">
      <CardFace />
    </span>
    <span className="absolute left-2 top-0 h-32 w-24">
      <CardFace symbol="PACK" number={5} />
    </span>
  </span>
);
