"use client";

import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition, type ChangeEvent, type FormEvent } from "react";

function SearchbarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    const params = new URLSearchParams(searchParams.toString());
    if (val.trim().length > 0) {
      params.set("q", val.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      const target = pathname === "/products" ? `/products?${params.toString()}` : `/products?${params.toString()}`;
      router.push(target);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim().length > 0) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-1 items-center justify-between gap-1 rounded-full border-2 border-white/30 px-3 py-1.5"
    >
      <input
        type="text"
        value={query}
        onChange={handleSearchChange}
        className="w-full flex-1 border-none bg-transparent outline-none placeholder:text-white/70 text-sm text-white"
        placeholder="Search fresh fruits, vegetables, categories..."
        aria-label="Search products"
      />

      {query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      )}

      <button type="submit" aria-label="Submit search" className="search-button shrink-0 text-white/80 hover:text-white">
        <Search className="search-icon size-4" />
      </button>
    </form>
  );
}

export default function Searchbar() {
  return (
    <Suspense fallback={<div className="flex-1 h-9 rounded-full border border-white/20 bg-white/10 animate-pulse" />}>
      <SearchbarInner />
    </Suspense>
  );
}