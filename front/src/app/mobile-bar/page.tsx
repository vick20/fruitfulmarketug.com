import Link from "next/link";

export default function MobileBarPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
        Events &amp; Catering
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
        Mobile Bar
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">
        Bring fresh tropical fruit juices, smoothies, and curated bar service to
        your weddings, corporate gatherings, and private celebrations with the
        Fruitful Market UG Mobile Bar.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/cocktails"
          className="inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-fresh"
        >
          Explore Cocktails
        </Link>
        <Link
          href="/products"
          className="inline-flex rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-background"
        >
          Shop Fresh Ingredients
        </Link>
      </div>
    </section>
  );
}
