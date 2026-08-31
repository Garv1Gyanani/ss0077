import { useEffect } from 'react';
import { generateFullJsonLd } from '../../data/seoEngine';

/**
 * SEOHead component that dynamically updates document metadata and injects JSON-LD schema
 * Strict compliance with indexable/noindex launch gate directives
 */
export default function SEOHead({ pageData }) {
  useEffect(() => {
    if (!pageData) return;

    const {
      metaTitle,
      metaDescription,
      path,
      schemaType = 'SoftwareApplication',
      openGraph = {},
      indexable = true
    } = pageData;

    const baseUrl = 'https://mingzy.space';
    const fullUrl = `${baseUrl}${path || ''}`;
    const defaultImage = openGraph.image ? `${baseUrl}${openGraph.image}` : `${baseUrl}/icons.svg`;

    // 1. Update Document Title
    document.title = metaTitle || 'Mingzy - Random Video & Text Chat with Strangers';

    // Helper to update or create meta tags
    const setMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create link tags
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags with Strict Index / NoIndex Gating
    setMetaTag('description', metaDescription);
    const robotsDirective = indexable 
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' 
      : 'noindex, follow';
    setMetaTag('robots', robotsDirective);
    setLinkTag('canonical', fullUrl);

    // Google Search Console Site Verification Meta Tag (Default / Configurable)
    setMetaTag('google-site-verification', 'GSC_VERIFICATION_TOKEN_PLACEHOLDER');

    // 3. OpenGraph Tags
    setMetaTag('og:title', openGraph.title || metaTitle, true);
    setMetaTag('og:description', openGraph.description || metaDescription, true);
    setMetaTag('og:url', fullUrl, true);
    setMetaTag('og:site_name', 'Mingzy', true);
    setMetaTag('og:type', openGraph.type || (schemaType === 'Article' ? 'article' : 'website'), true);
    setMetaTag('og:image', defaultImage, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    if (openGraph.imageAlt) {
      setMetaTag('og:image:alt', openGraph.imageAlt, true);
    }

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', openGraph.title || metaTitle);
    setMetaTag('twitter:description', openGraph.description || metaDescription);
    setMetaTag('twitter:image', defaultImage);

    // 5. JSON-LD Structured Data Schema Generation (Clean without fabricated metrics)
    const schemas = generateFullJsonLd(pageData, baseUrl);

    // Remove existing dynamic JSON-LD scripts
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld="true"]');
    existingScripts.forEach((el) => el.remove());

    // Inject updated schemas
    schemas.forEach((schemaObj) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.text = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });

    return () => {
      // Clean up injected json-ld scripts on unmount
      const injected = document.querySelectorAll('script[data-seo-jsonld="true"]');
      injected.forEach((el) => el.remove());
    };
  }, [pageData]);

  return null;
}
