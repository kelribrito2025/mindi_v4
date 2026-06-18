import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          // Data layer
          'query-vendor': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query', 'superjson'],
          // UI framework - Radix primitives
          'radix-vendor': [
            '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip',
            '@radix-ui/react-select', '@radix-ui/react-popover', '@radix-ui/react-tabs',
            '@radix-ui/react-accordion', '@radix-ui/react-checkbox', '@radix-ui/react-switch',
            '@radix-ui/react-alert-dialog', '@radix-ui/react-scroll-area', '@radix-ui/react-separator',
            '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-radio-group',
            '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-progress',
            '@radix-ui/react-slider', '@radix-ui/react-collapsible', '@radix-ui/react-avatar',
            '@radix-ui/react-aspect-ratio', '@radix-ui/react-hover-card', '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu', '@radix-ui/react-context-menu',
            '@radix-ui/react-visually-hidden',
          ],
          // UI utilities
          'ui-utils': ['sonner', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge', 'cmdk', 'vaul'],
          // Charts
          'charts-vendor': ['recharts'],
          // Animation & motion
          'motion-vendor': ['framer-motion'],
          // Date utilities
          'date-vendor': ['date-fns', 'react-day-picker'],
          // Forms
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // DnD
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Carousel & panels
          'layout-vendor': ['embla-carousel-react', 'react-resizable-panels', 'react-easy-crop'],
          // Stripe (client-side)
          'stripe-vendor': ['stripe'],
          // Router
          'router-vendor': ['wouter'],
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
