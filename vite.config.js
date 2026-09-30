import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    // Relative base: the build runs from any path, e.g. GitHub Pages' /makimuradev/.
    base: './',
    plugins: [react()],
    server: {
        host: true
    },
    build: {
        // three.js is large but changes rarely: give it its own long-cached chunk.
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    r3f: ['@react-three/fiber', '@react-three/drei'],
                }
            }
        }
    }
})
