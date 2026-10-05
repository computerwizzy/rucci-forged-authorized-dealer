import WheelsGallery from '@/components/WheelsGallery';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <SiteHeader />
      <WheelsGallery />
      <SiteFooter />
    </main>
  );
}
