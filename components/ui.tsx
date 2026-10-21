import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const solid = "bg-lime text-ink shadow-[4px_4px_0_0_#6f9a22] hover:brightness-110 active:translate-x-1 active:translate-y-1 active:shadow-none";
const ghost = "bg-black text-lime shadow-pixel hover:bg-ink active:translate-x-1 active:translate-y-1";

const buttonClass = (kind: "solid" | "ghost") =>
  `inline-flex min-h-12 items-center justify-center px-4 py-3 text-center font-pixel text-[10px] leading-6 sm:text-xs ${kind === "solid" ? solid : ghost} disabled:cursor-not-allowed disabled:opacity-40`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "solid" | "ghost"; href?: string };

export const PixelButton = ({ kind = "solid", href, className = "", children, ...props }: ButtonProps) => {
  if (href) {
    return (
      <Link href={href} className={`${buttonClass(kind)} ${className}`} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={`${buttonClass(kind)} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const PixelFrame = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-black p-4 shadow-pixel ${className}`}>{children}</div>
);

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block font-pixel text-[10px] leading-5 text-lime">{label}</span>
    {children}
  </label>
);

export const inputClass =
  "w-full border-0 bg-ink px-3 py-3 font-mono text-sm text-cream shadow-pixel outline-none placeholder:text-muted";
