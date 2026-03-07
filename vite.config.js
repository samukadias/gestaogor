import path from "path"
import { fileURLToPath } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt', // Require user interaction to reload when there's an update
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'GestaoGOR', // Using the new name explicitly requested for the roadmap
                short_name: 'GestaoGOR',
                description: 'Sistema de Gestão de Demandas e Contratos',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                // Determine what to cache from the build
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                // High risk area: Set specific caching rules
                runtimeCaching: [
                    {
                        // 1. RULE: Backend API Calls -> NEVER CACHE (Or Network Only/First)
                        // This prevents stale data from showing to users
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.includes(':3000'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 5, // Wait up to 5s for network, then fallback to cache if available
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 5 // Cache only lives for 5 minutes max as a fallback
                            },
                        },
                    },
                    {
                        // 2. RULE: External Images / Assets -> Cache First
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 80,
        host: true
    }
})
