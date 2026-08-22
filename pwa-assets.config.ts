import {
  defineConfig,
  minimal2023Preset,
  type Preset,
} from '@vite-pwa/assets-generator/config'

const preset: Preset = {
  ...minimal2023Preset,
  maskable: {
    ...minimal2023Preset.maskable,
    padding: 0.18,
    resizeOptions: {
      background: '#0b0b0d',
    },
  },
}

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset,
  images: ['public/favicon.svg'],
})
