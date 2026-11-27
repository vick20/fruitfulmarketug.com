'use client';
import { ProductCardData  } from "./types/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: ProductCardData[];
  columns?: number;
}
export default function ProductGrid({
  products,
}: ProductGridProps) {


  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
