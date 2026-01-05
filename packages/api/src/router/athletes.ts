import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, adminProcedure } from "../trpc";
import { athlete, teamData } from "@acme/db/schema";
import { eq, desc, and, isNull } from "@acme/db";
import { athleteValidator } from "@acme/shared/validators";

export const athletesRouter = {
    list: protectedProcedure.query(async ({ ctx }) => {
        // 1. Get the teamId associated with the current user
        const team = await ctx.db.query.teamData.findFirst({
            where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
        });

        if (!team) {
            // This theoretically shouldn't happen for a "team" user, but handle it
            return [];
        }

        // 2. Fetch athletes for this team
        return ctx.db.query.athlete.findMany({
            where: and(eq(athlete.teamId, team.id), isNull(athlete.deletedAt)),
            orderBy: [desc(athlete.createdAt)],
        });
    }),

    create: protectedProcedure
        .input(athleteValidator)
        .mutation(async ({ ctx, input }) => {
            // 1. Get the teamId
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No tienes un equipo asociado.",
                });
            }

            // 2. Create athlete
            // Using raw input directly + teamId
            return ctx.db.insert(athlete).values({
                ...input,
                teamId: team.id,
            });
        }),

    update: protectedProcedure
        .input(athleteValidator.and(z.object({ id: z.string().uuid() })))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No tienes un equipo asociado.",
                });
            }

            // Verify existence and ownership
            const existing = await ctx.db.query.athlete.findFirst({
                where: and(
                    eq(athlete.id, id),
                    eq(athlete.teamId, team.id),
                    isNull(athlete.deletedAt)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            await ctx.db.update(athlete).set(data).where(eq(athlete.id, id));

            return existing;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No tienes un equipo asociado.",
                });
            }

            const existing = await ctx.db.query.athlete.findFirst({
                where: and(
                    eq(athlete.id, input.id),
                    eq(athlete.teamId, team.id),
                    isNull(athlete.deletedAt)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            await ctx.db.update(athlete).set({ deletedAt: new Date() }).where(eq(athlete.id, input.id));
        }),

    listAll: adminProcedure
        .input(z.object({ teamId: z.string().uuid().optional() }).optional())
        .query(async ({ ctx, input }) => {
            if (input?.teamId) {
                return ctx.db.query.athlete.findMany({
                    where: and(eq(athlete.teamId, input.teamId), isNull(athlete.deletedAt)),
                    with: { team: { with: { user: true } } },
                    orderBy: [desc(athlete.createdAt)],
                });
            }
            return ctx.db.query.athlete.findMany({
                where: isNull(athlete.deletedAt),
                with: { team: { with: { user: true } } },
                orderBy: [desc(athlete.createdAt)],
            });
        }),
} satisfies TRPCRouterRecord;
