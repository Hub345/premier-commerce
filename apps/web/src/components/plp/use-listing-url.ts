"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Shared URL-state helper for the listing page. Filter state lives entirely in
// the query string, so links are shareable and the server re-renders on change.
export function useListingUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function currentParams(): URLSearchParams {
    return new URLSearchParams(searchParams.toString());
  }

  function commit(next: URLSearchParams, resetPage = true): void {
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAll(): void {
    router.push(pathname, { scroll: false });
  }

  return { searchParams, pathname, router, currentParams, commit, clearAll };
}
