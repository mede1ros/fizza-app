import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Ícones do app gerados a partir de public/icon.svg (rode: npx pwa-assets-generator) (fundo verde sem margem; o iOS arredonda).
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0.2, resizeOptions: { background: '#10b981' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#10b981' } },
  },
  images: ['public/icon.svg'],
})
