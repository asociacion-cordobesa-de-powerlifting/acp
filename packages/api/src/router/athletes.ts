import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";
import { athlete, teamData } from "@acme/db/schema";
import { eq, desc, and } from "@acme/db";
import { athleteValidator } from "@acme/shared/validators";

export const athletesRouter = {
    list: protectedProcedure.query(async ({ ctx }) => {
        // 1. Get the teamId associated with the current user
        const team = await ctx.db.query.teamData.findFirst({
            where: eq(teamData.userId, ctx.session.user.id)
        });

        if (!team) {
            // This theoretically shouldn't happen for a "team" user, but handle it
            return [];
        }

        // 2. Fetch athletes for this team
        return ctx.db.query.athlete.findMany({
            where: eq(athlete.teamId, team.id),
            orderBy: [desc(athlete.createdAt)],
        });
    }),

    create: protectedProcedure
        .input(athleteValidator)
        .mutation(async ({ ctx, input }) => {
            // 1. Get the teamId
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
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
                where: eq(teamData.userId, ctx.session.user.id)
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
                    eq(athlete.teamId, team.id)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            console.log("Updating athlete:", id, data);
            await ctx.db.update(athlete).set(data).where(eq(athlete.id, id));

            console.log("Updated athlete, returning existing:", existing);
            return existing; // returning old data or just success is ok? Client usually invalidates.
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
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
                    eq(athlete.teamId, team.id)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            await ctx.db.delete(athlete).where(eq(athlete.id, input.id));
        }),
} satisfies TRPCRouterRecord;
