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
  const { paused, showModal } = useOrdersPaused();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (paused) {
        e.preventDefault();
        showModal();
      }
    },
    [paused, showModal],
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
