import { protectedProcedure } from "../trpc";
import { user } from "@acme/db/schema";
import { TRPCRouterRecord } from "@trpc/server";
import { or, ne, eq, desc } from "@acme/db";

export const teamsRouter = {
    list: protectedProcedure
        .query(async ({ ctx }) => {

            // const users = await ctx.authApi.listUsers({
            //     headers: ctx.headers,
            //     query: {},
            // })

            // console.log('better-auth users api plugin', users)

            return ctx.db.query.user.findMany({
                where: or(ne(user.role, "admin"), eq(user.role, 'user')),
                orderBy: [desc(user.createdAt)],
            });
        }),
} satisfies TRPCRouterRecord;
