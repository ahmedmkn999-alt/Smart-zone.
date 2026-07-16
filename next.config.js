/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // hide the "X-Powered-By: Next.js" header
  images: {
    remotePatterns: [
      // أضف هنا أي دومين هتحط منه روابط صور المدرسين/المواد من لوحة التحكم
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
