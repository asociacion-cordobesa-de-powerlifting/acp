import { tournament, user } from "@acme/db/schema";
import { adminProcedure, protectedProcedure } from "../trpc";
import { or, ne, eq, desc, and, sql, not } from "@acme/db";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { tournamentValidator } from "@acme/shared/validators";
import { z } from "zod";
import { cleanAndLowercase } from '@acme/shared'
import { dayjs } from '@acme/shared/libs'


export const tournamentsRouter = {

    all: adminProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.tournament.findMany({
                orderBy: [desc(tournament.createdAt)],
            });
        }),

    list: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.tournament.findMany({
                orderBy: [desc(tournament.createdAt)],
                where: not(eq(tournament.status, 'draft'))
            });
        }),

    create: adminProcedure
        .input(tournamentValidator)
        .mutation(async ({ ctx, input }) => {
            const slug = cleanAndLowercase(input.name);
            const existing = await ctx.db.query.tournament.findFirst({
                where: eq(tournament.slug, slug)
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro torneo con el mismo nombre'
                });
            }

            const newTournament = await ctx.db.insert(tournament).values({
                ...input,
                slug,
            });

            return newTournament;
        }),

    update: adminProcedure
        .input(tournamentValidator.and(z.object({ id: z.string().uuid() })))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const slug = cleanAndLowercase(data.name);

            const existing = await ctx.db.query.tournament.findFirst({
                where: and(
                    eq(tournament.slug, slug),
                    ne(tournament.id, id)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro torneo con el mismo nombre'
                });
            }

            await ctx.db.update(tournament).set({
                ...data,
                slug,
            }).where(eq(tournament.id, id));

        }),

    delete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(tournament).where(eq(tournament.id, input.id));
        }),

} satisfies TRPCRouterRecord;