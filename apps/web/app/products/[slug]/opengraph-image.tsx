import { ImageResponse } from 'next/og';
import { getProductPage } from '@/lib/product-pages';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductPage(slug);
  const title = product?.ogTitle ?? 'VerbaLab';
  const family = product?.family ?? 'VerbaLab';
  const lede = product?.lede ?? "Africa's voice intelligence platform";

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #0f2f26 0%, #1a6b52 45%, #6fcf9c 100%)',
          color: '#f7fffb',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, opacity: 0.9, letterSpacing: 2, textTransform: 'uppercase' }}>
          {family}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.92, maxWidth: 920, lineHeight: 1.35 }}>{lede}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26 }}>
          <span style={{ fontWeight: 700 }}>VerbaLab</span>
          <span style={{ opacity: 0.85 }}>/products/{slug}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
