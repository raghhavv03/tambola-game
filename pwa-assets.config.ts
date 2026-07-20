import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

// Generates the icon set (192/512/maskable + apple-touch) from one source SVG.
export default defineConfig({
  preset: minimalPreset,
  images: ['public/app-icon.svg'],
})
