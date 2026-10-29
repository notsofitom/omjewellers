
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductGallery from "./ProductGallery";
import EnquiryForm from "@/app/components/EnquiryForm";
import StorefrontHeader from "@/app/components/StorefrontHeader";
import { SHOP_EMAIL, SHOP_WHATSAPP_NUMBER } from "@/lib/shop-details";
import { getCategoryLabel } from "@/lib/storefront-categories";

export const instant = false;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const decodedReference = decodeURIComponent(reference);

  const product = await prisma.product.findFirst({
    where: {
      reference: decodedReference,
      isActive: true,
    },
    select: {
      reference: true,
      name: true,
      category: true,
      imagePath: true,
      originalImagePath: true,
      price: true,
      description: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          imagePath: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fbf8f2] text-[#241d1a]">
      <StorefrontHeader />

      <section className="mx-auto grid max-w-[1280px] gap-8 px-4 py-7 sm:px-7 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-10 lg:py-14">
        <ProductGallery
          images={product.images}
          fallbackImage={product.imagePath}
          originalImagePath={product.originalImagePath}
          productName={product.name || `Jewellery reference ${product.reference}`}
        />

        <div className="flex flex-col justify-center rounded-[26px] border border-[#ebe2d8] bg-white p-6 sm:p-9">
          <Link href="/shop" className="mb-8 inline-flex w-fit text-sm font-medium text-[#7c5541] hover:underline">← Back to the collection</Link>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8c694f]">{getCategoryLabel(product.category)}</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-[#302421] sm:text-4xl">{product.name || "Jewellery design"}</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#948477]">Reference {product.reference}</p>

          {product.price !== null && <p className="mt-6 font-serif text-2xl text-[#49313a]">₹{product.price.toLocaleString("en-IN")}</p>}

          {product.description && <p className="mt-5 whitespace-pre-wrap border-t border-[#f0e9e1] pt-5 text-sm leading-7 text-[#6d5e54]">{product.description}</p>}

          <div className="mt-6 rounded-2xl bg-[#f7f1e9] p-4 text-sm leading-6 text-[#6d5e54]">
            Contact our team to confirm availability, specifications, and current pricing for this piece.
          </div>

          <EnquiryForm productReference={product.reference} productName={product.name || "Jewellery"} />

          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I am interested in ${product.name || "jewellery"} (reference ${product.reference}).`)}`} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-[#542d35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3f202a]">Ask on WhatsApp</a>
            <a href={`mailto:${SHOP_EMAIL}?subject=${encodeURIComponent(`Jewellery enquiry: ${product.name || "Jewellery"} (${product.reference})`)}`} className="inline-flex rounded-full border border-[#d9c8b3] px-5 py-3 text-sm font-semibold text-[#583641] transition hover:bg-[#f7f0e7]">Email about this piece</a>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-[1280px] px-4 pb-5 text-right sm:px-7 lg:px-10">
        <Link href="/dashboard/products" className="text-[11px] text-[#a29488] hover:text-[#743f35]">Owner sign in</Link>
      </footer>
    </main>
  );
}
