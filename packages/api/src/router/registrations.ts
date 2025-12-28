import { z } from "zod";
import { protectedProcedure } from "../trpc";
import { registrations, registrationStatusEnum, tournament, athlete, teamData, weightClassEnum, divisionEnum, eventEnum } from "@acme/db/schema";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { eq, and } from "@acme/db";
import { registrationValidator } from "@acme/shared/validators";

export const registrationsRouter = {
    create: protectedProcedure
        .input(registrationValidator)
        .mutation(async ({ ctx, input }) => {
            // 1. Get Team ID
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
            });

            if (!team) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "No tienes un equipo asociado.",
                });
            }

            // 2. Validate Athlete belongs to Team
            const athleteExists = await ctx.db.query.athlete.findFirst({
                where: and(
                    eq(athlete.id, input.athleteId),
                    eq(athlete.teamId, team.id)
                )
            });

            if (!athleteExists) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "El atleta no pertenece a tu equipo.",
                });
            }

            // 3. Verify Tournament Status (optional but good practice)
            const tournamentExists = await ctx.db.query.tournament.findFirst({
                where: eq(tournament.id, input.tournamentId)
            });


            if (!tournamentExists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Torneo no encontrado.",
                });
            }



            // 4. Check if already registered
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.athleteId, input.athleteId),
                    eq(registrations.tournamentId, input.tournamentId)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "El atleta ya está inscrito en este torneo.",
                });
            }

            return ctx.db.insert(registrations).values({
                ...input,
                teamId: team.id,
                status: "pending",
            });
        }),

    byTeam: protectedProcedure
        .query(async ({ ctx }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
            });

            if (!team) throw new TRPCError({
                code: "NOT_FOUND",
                message: "No se encontró un equipo asociado a tu cuenta.",
            });

            return await ctx.db.query.registrations.findMany({
                where: eq(registrations.teamId, team.id),
                with: {
                    athlete: true,
                    tournament: true,
                },
                orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
            });
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
            weightClass: z.enum(weightClassEnum.enumValues),
            squatOpenerKg: z.number().min(0).nullable().optional(),
            benchOpenerKg: z.number().min(0).nullable().optional(),
            deadliftOpenerKg: z.number().min(0).nullable().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
            });

            if (!team) {
                throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            }

            // Verify ownership
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.id, input.id),
                    eq(registrations.teamId, team.id)
                )
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            }

            return ctx.db.update(registrations)
                .set({
                    weightClass: input.weightClass,
                    squatOpenerKg: input.squatOpenerKg,
                    benchOpenerKg: input.benchOpenerKg,
                    deadliftOpenerKg: input.deadliftOpenerKg,
                })
                .where(eq(registrations.id, input.id));
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
            });

            if (!team) {
                throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            }

            // Verify ownership
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.id, input.id),
                    eq(registrations.teamId, team.id)
                )
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            }

            return ctx.db.delete(registrations).where(eq(registrations.id, input.id));
        }),
} satisfies TRPCRouterRecord;
