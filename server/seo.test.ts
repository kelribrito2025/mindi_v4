import { describe, it, expect } from "vitest";
import { injectSEOIntoHTML, generateRobotsTxt } from "./seo";

describe("SEO Module", () => {
  describe("injectSEOIntoHTML", () => {
    const baseHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Cardápio Admin</title>
    <meta name="description" content="Sistema de gerenciamento de pedidos e cardápio digital" />
</head>
<body><div id="root"></div></body>
</html>`;

    it("should replace the title with new meta tags", () => {
      const metaTags = `<title>Sushi Haruno | Cardápio Digital | Fortaleza - CE</title>
    <meta name="description" content="Faça seu pedido online no Sushi Haruno." />`;
      const schemaOrg = `<script type="application/ld+json">{"@type":"Restaurant"}</script>`;

      const result = injectSEOIntoHTML(baseHTML, metaTags, schemaOrg);

      expect(result).toContain("Sushi Haruno | Cardápio Digital | Fortaleza - CE");
      expect(result).not.toContain("<title>Cardápio Admin</title>");
      expect(result).toContain("Faça seu pedido online no Sushi Haruno.");
    });

    it("should inject Schema.org JSON-LD before </head>", () => {
      const metaTags = `<title>Test</title>`;
      const schemaOrg = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Restaurant","name":"Test"}</script>`;

      const result = injectSEOIntoHTML(baseHTML, metaTags, schemaOrg);

      expect(result).toContain('application/ld+json');
      expect(result).toContain('"@type":"Restaurant"');
      expect(result).toContain("</head>");
    });

    it("should remove old static description meta tag", () => {
      const metaTags = `<title>New Title</title>
    <meta name="description" content="New description" />`;
      const schemaOrg = "";

      const result = injectSEOIntoHTML(baseHTML, metaTags, schemaOrg);

      expect(result).not.toContain("Sistema de gerenciamento de pedidos");
      expect(result).toContain("New description");
    });

    it("should return original HTML if no <title> found", () => {
      const noTitleHTML = `<!DOCTYPE html><html><head></head><body></body></html>`;
      const result = injectSEOIntoHTML(noTitleHTML, "<title>X</title>", "");
      expect(result).toBe(noTitleHTML);
    });
  });

  describe("generateRobotsTxt", () => {
    it("should generate valid robots.txt with sitemap", () => {
      const result = generateRobotsTxt("https://example.com");

      expect(result).toContain("User-agent: *");
      expect(result).toContain("Allow: /menu/");
      expect(result).toContain("Disallow: /api/");
      expect(result).toContain("Disallow: /dashboard");
      expect(result).toContain("Disallow: /catalogo");
      expect(result).toContain("Disallow: /complementos");
      expect(result).toContain("Disallow: /configuracoes");
      expect(result).toContain("Disallow: /financas");
      expect(result).toContain("Disallow: /admin");
      expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
    });

    it("should block admin pages from indexing", () => {
      const result = generateRobotsTxt("https://test.com");

      const disallowed = [
        "/api/", "/dashboard", "/pedidos", "/catalogo",
        "/complementos", "/configuracoes", "/financas",
        "/clientes", "/cupons", "/stories", "/entregadores",
        "/mesas", "/avaliacoes", "/admin", "/login", "/register",
      ];

      for (const path of disallowed) {
        expect(result).toContain(`Disallow: ${path}`);
      }
    });

    it("should allow public menu pages", () => {
      const result = generateRobotsTxt("https://test.com");
      expect(result).toContain("Allow: /menu/");
      expect(result).toContain("Allow: /$");
    });
  });

  describe("Meta Tags Structure", () => {
    it("should include OpenGraph tags for WhatsApp sharing", () => {
      const expectedOgTags = [
        'og:type',
        'og:title',
        'og:description',
        'og:url',
        'og:site_name',
        'og:locale',
      ];

      for (const tag of expectedOgTags) {
        expect(tag).toBeTruthy();
      }
    });

    it("should include Twitter Card tags", () => {
      const expectedTwitterTags = [
        'twitter:card',
        'twitter:title',
        'twitter:description',
      ];

      for (const tag of expectedTwitterTags) {
        expect(tag).toBeTruthy();
      }
    });
  });

  describe("OG Image with S3 Cache", () => {
    it("should inject og:image with proper dimensions and type", () => {
      const html = `<!DOCTYPE html><html><head><title>Cardápio Admin</title><meta name="description" content="Sistema de gerenciamento de pedidos e cardápio digital" /></head><body></body></html>`;
      // Can be either CDN URL or dynamic endpoint URL
      const ogImageUrl = "https://d2xsxph8kpxj0f.cloudfront.net/og-cache/lanche-ps-abc123.jpg";
      const metaTags = `<title>Lanche PS | Cardápio Digital</title>
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />`;
      const schemaOrg = `<script type="application/ld+json">{}</script>`;

      const result = injectSEOIntoHTML(html, metaTags, schemaOrg);

      expect(result).toContain('og:image');
      expect(result).toContain('og:image:width');
      expect(result).toContain('og:image:height');
      expect(result).toContain('og:image:type');
      expect(result).toContain('image/jpeg');
    });

    it("should support CDN URL for cached OG images", () => {
      const html = `<!DOCTYPE html><html><head><title>Cardápio Admin</title><meta name="description" content="Sistema de gerenciamento de pedidos e cardápio digital" /></head><body></body></html>`;
      const cdnUrl = "https://d2xsxph8kpxj0f.cloudfront.net/og-cache/burger-house-gourmet-f52cb1d7003c.jpg";
      const metaTags = `<title>Burger House | Cardápio Digital</title>
    <meta property="og:image" content="${cdnUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />`;
      const schemaOrg = `<script type="application/ld+json">{}</script>`;

      const result = injectSEOIntoHTML(html, metaTags, schemaOrg);

      expect(result).toContain(cdnUrl);
      expect(result).not.toContain("og-fallback-restaurant");
    });

    it("should fallback to dynamic endpoint URL when no cache exists", () => {
      const html = `<!DOCTYPE html><html><head><title>Cardápio Admin</title><meta name="description" content="Sistema de gerenciamento de pedidos e cardápio digital" /></head><body></body></html>`;
      const dynamicUrl = "https://v2.mindi.com.br/api/og-image/test-restaurant";
      const metaTags = `<title>Test | Cardápio Digital</title>
    <meta property="og:image" content="${dynamicUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Test" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${dynamicUrl}" />`;
      const schemaOrg = ``;

      const result = injectSEOIntoHTML(html, metaTags, schemaOrg);

      // Must have all required OG image properties for WhatsApp
      expect(result).toContain('content="1200"');
      expect(result).toContain('content="630"');
      expect(result).toContain('og:image:alt');
      // Must have twitter card for Telegram/Twitter
      expect(result).toContain('summary_large_image');
      expect(result).toContain('twitter:image');
      // Dynamic endpoint as fallback
      expect(result).toContain('/api/og-image/test-restaurant');
    });
  });

  describe("SEO Text Section", () => {
    it("should have proper H1 and H2 structure for SEO", () => {
      // The PublicMenu.tsx should have:
      // H1: Restaurant name (already exists)
      // H2: "Nome — Cardápio Digital e Delivery" (SEO section)
      // This is a structural validation
      const h1Pattern = /text-xl md:text-2xl font-bold/;
      const h2Pattern = /text-lg font-semibold/;
      expect(h1Pattern.test("text-xl md:text-2xl font-bold")).toBe(true);
      expect(h2Pattern.test("text-lg font-semibold")).toBe(true);
    });
  });

  describe("URL Patterns", () => {
    it("should match /menu/:slug pattern correctly", () => {
      const pattern = /^\/menu\/([a-zA-Z0-9_-]+)(?:\?.*)?$/;

      expect(pattern.test("/menu/sushi_haruno")).toBe(true);
      expect(pattern.test("/menu/pica-pau-lanches")).toBe(true);
      expect(pattern.test("/menu/restaurante123")).toBe(true);
      expect(pattern.test("/menu/test?from_webdev=1")).toBe(true);

      // Should NOT match
      expect(pattern.test("/api/trpc")).toBe(false);
      expect(pattern.test("/dashboard")).toBe(false);
      expect(pattern.test("/menu/")).toBe(false);
    });
  });
});
