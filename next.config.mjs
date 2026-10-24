/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // v1 of this site served the CV at this path; keep links to it working.
  // /work and /writing were merged into /blog. The old route trees stay in the repo but the
  // canonical URL for both a case study and an essay is now /blog/<slug>.
  async redirects() {
    return [
      { source: "/Akib_Arifeen_Resume.pdf", destination: "/akib-arifeen-cv.pdf", permanent: false },
      { source: "/work", destination: "/blog", permanent: true },
      { source: "/work/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/writing", destination: "/blog", permanent: true },
      { source: "/writing/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};
export default nextConfig;
