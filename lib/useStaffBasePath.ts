"use client";
import { usePathname } from "next/navigation";

/**
 * The authoring screens are shared by admins and instructors, mounted under
 * /admin and /instructor respectively. This resolves which prefix the current
 * render is under so links stay inside that role's area - an instructor sent to
 * /admin/... would just be bounced back by middleware.
 */
export function useStaffBasePath(): "/admin" | "/instructor" {
  const pathname = usePathname();
  return pathname.startsWith("/instructor") ? "/instructor" : "/admin";
}
