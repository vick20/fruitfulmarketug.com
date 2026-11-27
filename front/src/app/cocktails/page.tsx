import Link from "next/link";

export default function CocktailsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
        Fresh Blends &amp; Mixology
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
        Cocktails
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">
        Discover refreshing fruit-forward cocktails and mocktails crafted from
        ripe Ugandan mangoes, passion fruit, pineapples, and fresh garden herbs.
      </p>
      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Shop Cocktail Fruits &amp; Herbs
        </Link>
      </div>
    </section>
  );
}
