import Link from "next/link";

export default function AboutUsPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
        Fruitful Market UG
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
        About Us
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">
        Fruitful Market UG connects households and businesses across Uganda with
        farm-fresh fruits, crisp vegetables, aromatic herbs, and everyday
        kitchen essentials delivered straight to your doorstep.
      </p>
      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          Browse Fresh Produce
        </Link>
      </div>
    </section>
  );
}
