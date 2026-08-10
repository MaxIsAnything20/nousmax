"use client";
import { useEffect } from "react";

// The library now lives inside the profile page.
export default function LibraryRedirect() {
  useEffect(() => { window.location.replace("/profile"); }, []);
  return null;
}
