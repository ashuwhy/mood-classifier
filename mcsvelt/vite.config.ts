import { defineConfig, Connect, ViteDevServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import electron from 'vite-plugin-electron'
import { join } from 'path'
import * as http from 'http'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isElectron = mode === 'electron';
  const plugins = [
    svelte({
      // Optimize Svelte compilation
      compilerOptions: {
        dev: isDev,
        immutable: true, // More efficient updates when data is immutable
      },
      // Speed up hot module replacement in development
      hot: isDev,
    }),
  ];

  if (isElectron) {
    plugins.push(
      electron([
        {
          // Main process - uses ES modules
          entry: 'electron/main.ts',
          onstart(options) {
            if (isDev) {
              console.log('Starting Electron process...');
              // In development, we don't want to start Electron here
              // since we're doing it via concurrently in the package.json
            }
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              minify: !isDev,
              sourcemap: isDev,
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
        {
          // Preload scripts - uses CommonJS
          entry: 'electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              minify: !isDev,
              sourcemap: isDev,
              // Use CommonJS format for preload script
              rollupOptions: {
                external: ['electron'],
                output: {
                  format: 'cjs',
                  entryFileNames: '[name].js' 
                }
              },
            },
          },
          onstart({ startup }) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Preload script rebuilding...');
            }
          },
        }
      ])
    );
  }

  return {
    plugins,
    base: './',
    build: {
      // Optimize build for speed and size
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096, // 4kb - smaller files will be inlined as base64
      reportCompressedSize: false, // Faster builds with less size reporting
      rollupOptions: {
        // Properly handle WASM files and optimize chunking
        output: {
          manualChunks: {
            'vendor': ['svelte'],
            'tf-core': ['@tensorflow/tfjs-core'],
            'tf-wasm': ['@tensorflow/tfjs-backend-wasm']
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
              return 'assets/wasm/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      // Improve CSS processing performance
      cssCodeSplit: true,
      // Improve build performance through multithreading
      outDir: 'dist'
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      headers: {
        // Set cross-origin headers required for SharedArrayBuffer (needed by some WASM features)
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        // Add CSP header for localhost dev server to allow blob: scripts
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; object-src 'none'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https://*; media-src 'self' blob:; connect-src 'self' https://*; worker-src 'self' blob:; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src 'none';"
      },
      fs: {
        // Allow serving files from public directory
        allow: ['..', 'public']
      },
      // Add middleware to set Content-Type for .wasm files
      configure: (server: ViteDevServer) => {
        server.middlewares.use((req: Connect.IncomingMessage, res: http.ServerResponse, next: () => void) => {
          if (req.url && req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          // Provide proper MIME type for blob scripts
          if (req.url && req.url.startsWith('/blob:')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          // @ts-ignore: intentionally ignoring type errors for next()
          next();
        });
      },
    },
    optimizeDeps: {
      // Optimize for faster startup
      include: ['svelte', '@tensorflow/tfjs-core'],
      exclude: ['electron'],
      esbuildOptions: {
        // Enable top-level await during dependency optimization
        target: 'esnext',
        // Improve WASM loading performance
        supported: { 
          'top-level-await': true 
        },
      }
    },
    // Ensure .wasm files are treated as assets
    assetsInclude: ['**/*.wasm'],
    // Speed up builds by using esbuild
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    // Cache busting during development - set to false to improve HMR performance
    cacheDir: '.vite',
  };
})
