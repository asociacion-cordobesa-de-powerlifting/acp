import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, oAuthProxy, username } from "better-auth/plugins";

import { db } from "@acme/db/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  // discordClientId: string;
  // discordClientSecret: string;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    appName: "ACP (Asociación Cordobesa de Powerlifting)",
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      admin(),
      username(),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      // discord: {
      //   clientId: options.discordClientId,
      //   clientSecret: options.discordClientSecret,
      //   redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
      // },
    },
    trustedOrigins: ["expo://", "http://localhost:3000", "https://cordobapowerlifting.com.ar", process.env.BASE_URL as string],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      cookiePrefix: "acp-auth"
    }
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
