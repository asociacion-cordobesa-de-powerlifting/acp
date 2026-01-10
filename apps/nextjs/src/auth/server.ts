import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@acme/auth";

import { env } from "~/env";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

export const auth = initAuth({
  baseUrl,
  productionUrl: process.env.BASE_URL ?? "http://localhost:3000",
  secret: env.AUTH_SECRET,
  // discordClientId: env.AUTH_DISCORD_ID,
  // discordClientSecret: env.AUTH_DISCORD_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
