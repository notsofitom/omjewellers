
"use client";

import { useState } from "react";

type GalleryImage = {
  id: string;
  imagePath: string;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  fallbackImage: string;
  originalImagePath: string | null;
  productName: string;
};

export default function ProductGallery({
  images,
  fallbackImage,
  originalImagePath,
  productName,
}: ProductGalleryProps) {
  const originalPath =
    originalImagePath ||
    (fallbackImage.startsWith("/catalogue/") ? fallbackImage : null);

  const sortedImages = [...images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.sortOrder - b.sortOrder
  );

  const combinedImages: GalleryImage[] = [];

  if (originalPath) {
    combinedImages.push({
      id: "original-catalogue",
      imagePath: originalPath,
      isPrimary: false,
      sortOrder: -1,
    });
  }

  for (const image of sortedImages) {
    if (
      !combinedImages.some(
        (existing) => existing.imagePath === image.imagePath
      )
    ) {
      combinedImages.push(image);
    }
  }

  if (
    combinedImages.length === 0 ||
    !combinedImages.some((image) => image.imagePath === fallbackImage)
  ) {
    if (
      fallbackImage &&
      !combinedImages.some((image) => image.imagePath === fallbackImage)
    ) {
      combinedImages.push({
        id: "current-main",
        imagePath: fallbackImage,
        isPrimary: true,
        sortOrder: 0,
      });
    }
  }

  const galleryImages =
    combinedImages.length > 0
      ? combinedImages
      : [
          {
            id: "fallback",
            imagePath: "/images/placeholder.png",
            isPrimary: true,
            sortOrder: 0,
          },
        ];

  const [selectedImage, setSelectedImage] = useState(
    () =>
      galleryImages.find((image) => image.isPrimary) ?? galleryImages[0]
  );

  return (
    <div className="space-y-4">
      <div className="flex min-h-80 items-center justify-center overflow-hidden rounded-[26px] border border-[#ebe2d8] bg-white p-4 sm:p-6">
        <a
          href={selectedImage.imagePath}
          target="_blank"
          rel="noreferrer"
          aria-label="Open full-size product photo in a new tab"
          className="flex w-full items-center justify-center"
        >
          <img
            src={selectedImage.imagePath}
            alt={productName}
            className="max-h-[600px] w-full object-contain"
          />
        </a>
      </div>

      {galleryImages.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImage(image)}
              aria-label={`View product photo ${index + 1}`}
              aria-pressed={selectedImage.id === image.id}
              className={`h-20 w-20 overflow-hidden rounded-xl border-2 bg-white p-1 ${
                selectedImage.id === image.id
                  ? "border-[#8c694f]"
                  : "border-[#ebe2d8] hover:border-[#c6a26a]"
              }`}
            >
              <img
                src={image.imagePath}
                alt={`${productName} photo ${index + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
