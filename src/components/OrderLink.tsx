"use client";

import { useOrdersPaused } from "./OrdersPausedProvider";
import { useCallback, type ReactNode, type MouseEvent } from "react";

interface OrderLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

export default function OrderLink({ href, children, ...rest }: OrderLinkProps) {
  const { paused, showModal, externalOrderUrl } = useOrdersPaused();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (paused) {
        e.preventDefault();
        if (externalOrderUrl) {
          window.open(externalOrderUrl, "_blank", "noopener,noreferrer");
        } else {
          showModal();
        }
      }
    },
    [paused, showModal, externalOrderUrl],
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
