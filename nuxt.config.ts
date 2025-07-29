// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  // app: {
  //   buildAssetsDir: '/_nuxt/',
  //   baseURL: '/kafka/'
  // },
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
