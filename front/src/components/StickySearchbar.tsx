"use client";

import Searchbar from "./searchbar";
import {AnimatedCartBadge} from "./cart/Animatedcart";
import  useCart  from "../hooks/useCart";

export default function StickySearchBar() {
  const { count, isReady, uiOpen} = useCart();

  return (
    <div className="flex flex-row items-center gap-2 w-full md:mx-auto md:max-w-7xl md:px-4">

      <Searchbar />

      <AnimatedCartBadge
        count={isReady ? count : 0}
        icon="basket"
        onClick={() => uiOpen({state: true, change: true})}
      />

    </div>
  );
}