import { PixelButton, PixelFrame } from "@/components/ui";

const MissingPage = () => (
  <PixelFrame className="mx-auto max-w-lg">
    <p className="font-pixel text-[10px] text-lime">404</p>
    <h1 className="mt-3 font-pixel text-sm leading-7 text-cream">THAT PAGE IS NOT ON THE BOARD.</h1>
    <div className="mt-4">
      <PixelButton href="/">HOME</PixelButton>
    </div>
  </PixelFrame>
);

export default MissingPage;
