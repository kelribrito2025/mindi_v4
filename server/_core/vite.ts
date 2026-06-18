import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectSEOIntoHTML } from "../seo";
import { logger } from "./logger";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);

      // Inject SEO meta tags for /menu/:slug routes
      const seoData = (req as any).__seoData;
      if (seoData) {
        page = injectSEOIntoHTML(page, seoData.metaTags, seoData.schemaOrg);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    logger.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  const uploadPath = process.env.LOCAL_UPLOAD_ROOT || path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(uploadPath, { recursive: true });
  app.use("/uploads", express.static(uploadPath, {
    maxAge: "365d",
    immutable: true,
  }));

  // S20: Cache headers otimizados para assets estáticos
  app.use(express.static(distPath, {
    maxAge: "0",
    setHeaders: (res, filePath) => {
      const normalizedFilePath = filePath.replace(/\\/g, "/");
      if (
        normalizedFilePath.endsWith("/index.html") ||
        normalizedFilePath.endsWith("/sw.js") ||
        normalizedFilePath.endsWith("/manifest.json")
      ) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return;
      }

      // JS/CSS com hash no nome: cache longo + immutable
      if (/\.(js|css)$/i.test(filePath) && /[.\-][A-Za-z0-9_-]{8,}\./.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (/\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|eot)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800"); // 7 days
      }
    },
  }));

  // Se um asset versionado não existir, nunca devolver o index.html.
  // Caso contrário, navegadores/CDNs podem armazenar HTML como JS/CSS e causar tela branca por MIME inválido.
  app.use("/assets", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.status(404).type("text/plain").send("Asset not found");
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const indexPath = path.resolve(distPath, "index.html");
    
    // Inject SEO meta tags for /menu/:slug routes in production
    const seoData = (req as any).__seoData;
    if (seoData) {
      try {
        let html = fs.readFileSync(indexPath, "utf-8");
        html = injectSEOIntoHTML(html, seoData.metaTags, seoData.schemaOrg);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
        return;
      } catch (error) {
        logger.error("[SEO] Error injecting meta tags in production:", error);
      }
    }

    res.sendFile(indexPath);
  });
}
