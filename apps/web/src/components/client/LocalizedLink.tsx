"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import React, { ComponentProps } from "react";

export function LocalizedLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  let localizedHref = href;
  if (typeof href === "string") {
    // If it's an absolute internal path, prefix with lang
    if (href.startsWith("/") && !href.startsWith(`/${lang}/`) && href !== `/${lang}`) {
      localizedHref = `/${lang}${href === "/" ? "" : href}`;
    }
  } else if (href && typeof href === "object" && href.pathname) {
    if (
      href.pathname.startsWith("/") &&
      !href.pathname.startsWith(`/${lang}/`) &&
      href.pathname !== `/${lang}`
    ) {
      localizedHref = {
        ...href,
        pathname: `/${lang}${href.pathname === "/" ? "" : href.pathname}`,
      };
    }
  }

  return <NextLink href={localizedHref} {...props} />;
}
