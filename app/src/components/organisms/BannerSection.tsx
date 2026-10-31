import { AppImage, Container } from "@/components/atoms";
import { MobileSlider, SectionHeader } from "@/components/molecules";
import Link from "next/link";

interface BannerSlide {
  image: string | null;
  text: string | null;
  link: string | null;
}

interface BannerSectionProps {
  title: string;
  slides: BannerSlide[];
}

/** Horizontal scrollable banner strip with text overlay on each image. */
export function BannerSection({ title, slides }: BannerSectionProps) {
  const validSlides = slides.filter((s) => s.image);
  if (validSlides.length === 0) return null;

  const cards = validSlides.map((slide, i) => {
    const inner = (
      <div className="relative h-[180px] w-full md:h-[150px] md:w-auto">
        <AppImage
          src={slide.image!}
          alt={slide.text ?? ""}
          fill
          sizes="(min-width: 768px) 25vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {slide.text && (
          <div className="absolute inset-0 flex items-center justify-start bg-black/15 pl-5">
            <span className="font-heading text-2xl font-semibold tracking-wide text-white drop-shadow-lg md:text-3xl">
              {slide.text}
            </span>
          </div>
        )}
      </div>
    );

    if (slide.link) {
      return (
        <Link key={i} href={slide.link} className="group block overflow-hidden rounded-xl md:flex-1">
          {inner}
        </Link>
      );
    }

    return (
      <div key={i} className="group block overflow-hidden rounded-xl md:flex-1">
        {inner}
      </div>
    );
  });

  return (
    <section className="py-6 sm:py-8 md:py-10">
      <Container>
        {title && <SectionHeader title={title} />}
        <MobileSlider>{cards}</MobileSlider>
      </Container>
    </section>
  );
}
