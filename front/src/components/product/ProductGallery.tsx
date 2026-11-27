"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { ProductImage } from "./types/product";

interface ProductGalleryProps {
  productName: string;
  images: ProductImage[];
}

export default function ProductGallery({
  productName,
  images,
}: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const safeIndex =
    images.length > 0 ? Math.min(selectedImageIndex, images.length - 1) : 0;
  const selectedImage = images[safeIndex];
  const hasMultiple = images.length > 1;

  const goPrev = () => {
    if (!hasMultiple) return;
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (!hasMultiple) return;
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || !hasMultiple) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
  };

  if (!selectedImage) {
    return (
      <div
        role="img"
        aria-label={`No images available for ${productName}`}
        className="flex aspect-[4/3] sm:aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-text-muted"
      >
        <ImageOff className="h-8 w-8 opacity-50" aria-hidden="true" />
        <span className="text-sm">{productName}</span>
      </div>
    );
  }

  const isSelectedBroken = Boolean(failedUrls[selectedImage.url]);

  return (
    <div
      className="space-y-3"
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`${productName} photo gallery`}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[4/3] sm:aspect-square overflow-hidden rounded-2xl border border-border bg-surface select-none"
      >
        {isSelectedBroken ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-background text-text-muted">
            <ImageOff className="h-8 w-8 opacity-50" aria-hidden="true" />
            <span className="text-sm">{productName}</span>
          </div>
        ) : (
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt_text?.trim() || productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-opacity duration-200"
            onError={() =>
              setFailedUrls((prev) => ({ ...prev, [selectedImage.url]: true }))
            }
          />
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <span
              aria-live="polite"
              className="absolute bottom-3 right-3 z-10 rounded-md bg-black/65 px-2.5 py-1 font-mono text-xs font-medium text-white tabular-nums backdrop-blur-sm"
            >
              {safeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1"
          role="list"
          aria-label={`${productName} image thumbnails`}
        >
          {images.map((image, index) => {
            const isSelected = safeIndex === index;
            const isBroken = Boolean(failedUrls[image.url]);
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                aria-label={`View image ${index + 1} of ${images.length} for ${productName}`}
                aria-pressed={isSelected}
                className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-none cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border opacity-75 hover:opacity-100"
                }`}
              >
                {isBroken ? (
                  <div className="flex h-full w-full items-center justify-center bg-background text-text-muted">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                  </div>
                ) : (
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={() =>
                      setFailedUrls((prev) => ({ ...prev, [image.url]: true }))
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
