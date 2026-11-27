"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Appbar from "./appbar";
import StickySearchBar from "./StickySearchbar";
import MyFooter from "./footer";
import CartSlideIn from "./cart/Cartpage";
import { OfflineIndicator } from "./pwa/OfflineIndicator";

function StorefrontChromeInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        {children}
        <OfflineIndicator />
      </>
    );
  }

  return (
    <>
      <Appbar />

      {/* Sticky Search Bar on storefront */}
      <div className="flex flex-row gap-2 w-full sticky top-0 z-50 text-background px-2 pb-2 pt-3 shadow-md bg-primary backdrop-blur-sm bg-opacity-80">
        <StickySearchBar />
      </div>

      {/* Slide in cart drawer */}
      <CartSlideIn />

      <main>{children}</main>

      <MyFooter />

      <OfflineIndicator />
    </>
  );
}

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<main>{children}</main>}>
      <StorefrontChromeInner>{children}</StorefrontChromeInner>
    </Suspense>
  );
}
