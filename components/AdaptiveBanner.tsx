type AdaptiveBannerProps = {
  enabled: boolean;
};

// TypeScript/native resolver fallback. Native builds load AdaptiveBanner.native.tsx.
export function AdaptiveBanner(_props: AdaptiveBannerProps) {
  return null;
}
