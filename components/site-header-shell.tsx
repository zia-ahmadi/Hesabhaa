"use client";

import { Suspense } from "react";
import SiteHeader from "@/components/site-header";

export default function SiteHeaderShell() {
  return (
    <Suspense fallback={null}>
      <SiteHeader />
    </Suspense>
  );
}
