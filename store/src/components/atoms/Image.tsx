import NextImage from "next/image";

interface Props extends Omit<React.ComponentProps<typeof NextImage>, "src"> {
  src: string | null | undefined;
  alt: string;
}

export function Image({ src, alt, ...rest }: Props) {
  if (!src) {
    return <span aria-hidden className="absolute inset-0 block bg-[#e8e4db]" />;
  }
  const isSvg = typeof src === "string" && /\.svg(\?|$)/i.test(src);
  return <NextImage src={src} alt={alt} unoptimized={isSvg} {...rest} />;
}
