import Image, { type ImageProps } from "next/image";

/**
 * Thin wrapper over next/image. SVGs (the seeded dummy images) skip the
 * optimizer; real JPG/PNG/WebP product photos from the API are optimized.
 */
export function AppImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: ImageProps["src"] | null | undefined }) {
  if (!src) {
    return <span aria-hidden="true" className="absolute inset-0 block bg-[#e8e4db]" />;
  }
  const isSvg = typeof src === "string" && /\.svg(\?|$)/i.test(src);
  return <Image src={src} alt={alt} unoptimized={isSvg} {...props} />;
}
