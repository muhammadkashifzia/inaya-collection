import { HomeTemplate } from "@/components/templates";
import { getHome } from "@/lib/data";

export default async function HomePage() {
  const home = await getHome();
  return <HomeTemplate home={home} />;
}
