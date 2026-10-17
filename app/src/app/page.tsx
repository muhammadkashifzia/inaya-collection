import { HomeTemplate } from "@/components/templates";
import { getHome, getSite } from "@/lib/data";

export default async function HomePage() {
  const [site, home] = await Promise.all([getSite(), getHome()]);
  return <HomeTemplate site={site} home={home} />;
}
