export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/settings/'],
    },
    sitemap: 'https://desayner.com/sitemap.xml',
  }
}
