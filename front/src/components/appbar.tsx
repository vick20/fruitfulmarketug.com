"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MenuToggle from "./toggleMenue";
import Image from "next/image";
import { PWAInstallButton } from "./pwa/PWAInstallButton";

const navItems = [
  { label: "About Us", href: "/about-us" },
  { label: "Mobile Bar", href: "/mobile-bar" },
  { label: "Cocktails", href: "/cocktails" },
  { label: "Admin", href: "/admin" },
];

function DesktopNavLinks({ activePath }: { activePath: string | null }) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium tracking-wide transition-colors hover:text-accent ${
              isActive
                ? "text-accent underline underline-offset-8 decoration-2"
                : "text-white/90"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function DesktopNavWithPathname() {
  const pathname = usePathname();
  return <DesktopNavLinks activePath={pathname} />;
}

function MobileNavLinks({
  activePath,
  onNavigate,
}: {
  activePath: string | null;
  onNavigate: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-text hover:bg-background hover:text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function MobileNavWithPathname({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return <MobileNavLinks activePath={pathname} onNavigate={onNavigate} />;
}

export default function Appbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* 1. Top Bar: Scrolls away naturally */}
      <header className="appbar flex flex-col bg-primary text-white px-2 md:px-6">
        <div className="flex flex-row justify-between items-center md:mx-auto md:w-full md:max-w-7xl md:py-2">
          {/* logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/full_logo.png"
              alt="Fruitful Market UG logo"
              width={200}
              height={160}
              className="h-auto w-[160px] sm:w-[180px] md:w-[190px]"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-6"
          >
            <Suspense fallback={<DesktopNavLinks activePath={null} />}>
              <DesktopNavWithPathname />
            </Suspense>
            <PWAInstallButton variant="compact" />
          </nav>

          {/* Mobile Menu Toggle (unchanged on mobile) */}
          <div className="icons flex flex-row items-center gap-2 md:hidden">
            <PWAInstallButton variant="compact" />
            <MenuToggle
              bg="bg-background"
              isOpen={isMenuOpen}
              onToggle={setIsMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Navigation Drawer */}
      <div
        role="dialog"
        aria-label="Menu"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
        className={`fixed right-0 top-0 z-[60] flex h-dvh w-[85vw] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-white">
          <span className="text-lg font-bold">Menu</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-md text-2xl leading-none text-white hover:bg-white/10"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="flex flex-col gap-1 p-4">
          <Suspense
            fallback={
              <MobileNavLinks
                activePath={null}
                onNavigate={() => setIsMenuOpen(false)}
              />
            }
          >
            <MobileNavWithPathname onNavigate={() => setIsMenuOpen(false)} />
          </Suspense>
        </nav>
      </div>
    </>
  );
}
