import Image from "next/image";
import type { ReactElement } from "react";

type BrandLogoProps = {
  className?: string;
  eager?: boolean;
};

export function BrandLogo({ className = "", eager = false }: BrandLogoProps): ReactElement {
  return (
    <span className={`brandLogo ${className}`}>
      <Image
        className="brandLogoImage"
        src="/brand/blog-do-carro-logo.png"
        alt="Blog do Carro"
        width={1080}
        height={1920}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
      />
    </span>
  );
}
