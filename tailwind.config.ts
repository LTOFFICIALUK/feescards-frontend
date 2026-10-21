import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lime: "#B8F34A",
        ink: "#122000",
        cream: "#F2EEE3",
        muted: "#8F8A7E",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        pixel: [
          "0 -4px 0 0 #B8F34A",
          "0 4px 0 0 #B8F34A",
          "-4px 0 0 0 #B8F34A",
          "4px 0 0 0 #B8F34A",
          "-8px 4px 0 0 #B8F34A",
          "8px 4px 0 0 #B8F34A",
          "-8px -4px 0 0 #B8F34A",
          "8px -4px 0 0 #B8F34A",
          "-4px 8px 0 0 #B8F34A",
          "4px 8px 0 0 #B8F34A",
          "-4px -8px 0 0 #B8F34A",
          "4px -8px 0 0 #B8F34A",
        ].join(", "),
        "pixel-mute": [
          "0 -4px 0 0 #2a2a2a",
          "0 4px 0 0 #2a2a2a",
          "-4px 0 0 0 #2a2a2a",
          "4px 0 0 0 #2a2a2a",
        ].join(", "),
      },
    },
  },
  plugins: [],
};

export default config;
