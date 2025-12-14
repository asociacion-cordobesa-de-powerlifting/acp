import { tournament, user } from "@acme/db/schema";
import { adminProcedure, protectedProcedure } from "../trpc";
import { or, ne, eq, desc } from "@acme/db";
import { TRPCRouterRecord } from "@trpc/server";
import { tournamentValidator } from "@acme/shared/validators";

export const tournamentsRouter = {
    list: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.user.findMany({
                where: or(ne(user.role, "admin"), eq(user.role, 'user')),
                orderBy: [desc(user.createdAt)],
            });
        }),

    create: adminProcedure
        .input(tournamentValidator)
        .mutation(async ({ ctx, input }) => {

            const newTournament = await ctx.db.insert(tournament).values({
                ...input
            });

            return newTournament;
        }),

} satisfies TRPCRouterRecord;