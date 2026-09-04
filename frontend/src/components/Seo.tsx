import { useEffect } from 'react';

const SITE_URL = 'https://ihsan-web-app-main.vercel.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoProps {
  title: string;
  description: string;
  /** Path only, e.g. "/zikr" — combined with SITE_URL for canonical + OG url. */
  path: string;
  /** Keep true (default) for indexable pages; false emits noindex (e.g. 404). */
  index?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Per-route title/description/canonical/OG override. index.html ships
 * site-wide defaults for the initial paint; this corrects them once the
 * route is known, since every page otherwise shared one <title> (bad for
 * SEO and for real search-result snippets on tracker pages).
 */
export default function Seo({ title, description, path, index = true }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('Ihsan') ? title : `${title} | Ihsan`;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', index ? 'index, follow' : 'noindex, follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', DEFAULT_IMAGE);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', DEFAULT_IMAGE);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, path, index]);

  return null;
}
