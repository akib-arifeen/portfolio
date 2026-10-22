/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // v1 of this site served the CV at this path; keep links to it working.
  async redirects() {
    return [{ source: "/Akib_Arifeen_Resume.pdf", destination: "/akib-arifeen-cv.pdf", permanent: false }];
  },
};
export default nextConfig;
