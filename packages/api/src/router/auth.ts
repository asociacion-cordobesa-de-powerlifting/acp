import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  test: publicProcedure.query(({ ctx }) => {
    return 'PUBLIC'
  }),
  getSecretMessage: protectedProcedure.query(({ ctx }) => {
    return "you can see this secret message!";
  }),
} satisfies TRPCRouterRecord;
