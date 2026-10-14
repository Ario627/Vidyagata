"use server";

import type { Route } from "next";
import { defaultLandingPath } from "@/data/roles";

export async function resolveLandingAction(): Promise<Route> {
  return defaultLandingPath();
}
