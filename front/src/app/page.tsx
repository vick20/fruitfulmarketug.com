import { Suspense } from 'react';
import Link from 'next/link';
import ProductGrid from '../components/product/productGrid';
import HeroSlider from '../components/slider';
import { getProducts } from '../lib/product/productsProvider';

async function FeaturedProducts() {
  const { items } = await getProducts({ page: 1, pageSize: 12 });
  return <ProductGrid products={items} />;
}

export default function Home() {
  return (
    <div className="overflow-x-none items-center flex flex-col flex-1 items-center justify-center bg-background font-sans dark:bg-black">
      <div className=" w-full min-h-screen p-3">
        <div className="mt-4">
          <Suspense fallback={<div className="min-h-[360px] w-full rounded-2xl bg-primary md:min-h-[400px]" />}>
            <HeroSlider />
          </Suspense>
        </div>

        {/* feated productgrid */}
        <div className="sticky top-[56px] z-40 flex flex-row justify-between mb-2 text-primary">
          <p className=''>featured products</p>
          <Link href="/products" className="font-medium hover:underline">
            see all
          </Link>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading products...</div>}>
          <FeaturedProducts />
        </Suspense>
      </div>

     

    </div>
  );
}
