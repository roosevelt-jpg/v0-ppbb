'use client';

import type { ProductDemoMedia as Media } from '@/lib/product-stories';

export function ProductDemoMedia({ media }: { media: Media }) {
  return (
    <section className="vl-prod-media" id="illustrations">
      <div className="vl-prod-media-copy">
        <p className="vl-mkt-kicker">Illustrations</p>
        <h2>{media.title}</h2>
        <p>{media.caption}</p>
        <div className="vl-prod-media-audio">
          {media.audioSamples.map((sample) => (
            <label key={sample.src} className="vl-prod-media-track">
              <span>{sample.label}</span>
              <audio controls preload="metadata" src={sample.src}>
                <track kind="captions" />
              </audio>
            </label>
          ))}
        </div>
      </div>
      <div className="vl-prod-media-frame">
        {/* Animated SVG filmstrip — acts as an embedded demo video illustration */}
        <object type="image/svg+xml" data={media.poster} aria-label={media.title} className="vl-prod-media-object">
          {/* fallback */}
          <img src={media.poster} alt={media.title} />
        </object>
      </div>
    </section>
  );
}
