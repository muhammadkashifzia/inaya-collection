import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageProps = any;

function NextImage(props: Record<string, unknown>) {
  const { fill, priority, quality, placeholder, blurDataURL, loader, unoptimized, ...rest } = props;
  return <img {...rest} />;
}

export default NextImage;
export type { ImageProps };
