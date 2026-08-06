import FrameworkLink from "next/link";
import type { ComponentProps, ReactElement } from "react";

type SiteLinkProps = ComponentProps<typeof FrameworkLink>;

export function SiteLink({ prefetch = false, ...props }: SiteLinkProps): ReactElement {
  // Vinext beta currently breaks speculative RSC prefetching in production; client-side navigation remains enabled.
  return <FrameworkLink {...props} prefetch={prefetch} />;
}
