// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  vite: {
    server: {
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'hoangnd.shopprint.click'
      ]
    }
  }
})
