import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, adminProcedure, publicProcedure } from "../trpc";
import { athlete, teamData, user } from "@acme/db/schema";
import { eq, desc, and, isNull } from "@acme/db";
import { athleteValidator } from "@acme/shared/validators";

export const athletesRouter = {

    // Public endpoint - no auth required, excludes sensitive data
    publicList: publicProcedure
        .query(async ({ ctx }) => {
            const athletes = await ctx.db.query.athlete.findMany({
                where: isNull(athlete.deletedAt),
                with: {
                    team: {
                        with: { user: true }
                    }
                },
                orderBy: [desc(athlete.createdAt)],
            });

            // Return only public info (no DNI)
            return athletes.map(a => ({
                id: a.id,
                fullName: a.fullName,
                birthYear: a.birthYear,
                gender: a.gender,
                teamName: a.team.user.name,
                squatBestKg: a.squatBestKg,
                benchBestKg: a.benchBestKg,
                deadliftBestKg: a.deadliftBestKg,
            }));
        }),

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

    // Admin endpoints for managing any athlete
    adminCreate: adminProcedure
        .input(athleteValidator.and(z.object({ teamId: z.string().uuid() })))
        .mutation(async ({ ctx, input }) => {
            const { teamId, ...data } = input;

            // Verify team exists
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.id, teamId), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Equipo no encontrado.",
                });
            }

            return ctx.db.insert(athlete).values({
                ...data,
                teamId,
            });
        }),

    adminUpdate: adminProcedure
        .input(athleteValidator.and(z.object({
            id: z.string().uuid(),
            teamId: z.string().uuid().optional()
        })))
        .mutation(async ({ ctx, input }) => {
            const { id, teamId, ...data } = input;

            // Verify athlete exists
            const existing = await ctx.db.query.athlete.findFirst({
                where: and(eq(athlete.id, id), isNull(athlete.deletedAt))
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            // If changing team, verify new team exists
            if (teamId && teamId !== existing.teamId) {
                const team = await ctx.db.query.teamData.findFirst({
                    where: and(eq(teamData.id, teamId), isNull(teamData.deletedAt))
                });

                if (!team) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Equipo destino no encontrado.",
                    });
                }
            }

            await ctx.db.update(athlete).set({
                ...data,
                ...(teamId ? { teamId } : {}),
            }).where(eq(athlete.id, id));

            return existing;
        }),

    adminDelete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.athlete.findFirst({
                where: and(eq(athlete.id, input.id), isNull(athlete.deletedAt))
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Atleta no encontrado.",
                });
            }

            await ctx.db.update(athlete).set({ deletedAt: new Date() }).where(eq(athlete.id, input.id));
        }),
} satisfies TRPCRouterRecord;
