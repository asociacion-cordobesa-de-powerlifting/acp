import { z } from "zod";
import { protectedProcedure } from "../trpc";
import { registrations, registrationStatusEnum, tournament, athlete, teamData, weightClassEnum, divisionEnum, eventEnum } from "@acme/db/schema";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { eq, and, isNull } from "@acme/db";
import { registrationValidator } from "@acme/shared/validators";

export const registrationsRouter = {
    create: protectedProcedure
        .input(registrationValidator)
        .mutation(async ({ ctx, input }) => {
            // 1. Get Team ID
            const team = await ctx.db.query.teamData.findFirst({
                where: and(
                    eq(teamData.userId, ctx.session.user.id),
                    isNull(teamData.deletedAt)
                )
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
                    eq(athlete.teamId, team.id),
                    isNull(athlete.deletedAt)
                )
            });

            if (!athleteExists) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "El atleta no pertenece a tu equipo.",
                });
            }

            // 3. Verify Tournament Status
            const tournamentExists = await ctx.db.query.tournament.findFirst({
                where: and(
                    eq(tournament.id, input.tournamentId),
                    isNull(tournament.deletedAt)
                )
            });


            if (!tournamentExists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Torneo no encontrado.",
                });
            }

            // NEW: Validation of Tournament Instance (must have parentId)
            if (!(tournamentExists as any).parentId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Solo se permite la inscripción en instancias específicas (ej. Classic, Equipped).",
                });
            }

            // NEW: Validation of Gender
            if (!input.weightClass.startsWith(athleteExists.gender)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `La categoría de peso ${input.weightClass} no corresponde al género ${athleteExists.gender}.`,
                });
            }

            // 4. Check if already registered
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.athleteId, input.athleteId),
                    eq(registrations.tournamentId, input.tournamentId),
                    isNull(registrations.deletedAt)
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

    bulkRegister: protectedProcedure
        .input(z.object({
            tournamentId: z.string().uuid(),
            registrations: z.array(z.object({
                athleteId: z.string().uuid(),
                weightClass: z.enum(weightClassEnum.enumValues),
                squatOpenerKg: z.number().min(0).nullable(),
                benchOpenerKg: z.number().min(0).nullable(),
                deadliftOpenerKg: z.number().min(0).nullable(),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });

            const tournamentExists = await ctx.db.query.tournament.findFirst({
                where: and(eq(tournament.id, input.tournamentId), isNull(tournament.deletedAt))
            });

            if (!tournamentExists) throw new TRPCError({ code: "NOT_FOUND", message: "Torneo no encontrado." });
            if (!(tournamentExists as any).parentId) throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se permite la inscripción masiva en instancias específicas." });

            return await ctx.db.transaction(async (tx) => {
                for (const reg of input.registrations) {
                    const athleteExists = await tx.query.athlete.findFirst({
                        where: and(eq(athlete.id, reg.athleteId), eq(athlete.teamId, team.id), isNull(athlete.deletedAt))
                    });

                    if (!athleteExists) throw new TRPCError({ code: "BAD_REQUEST", message: `El atleta con ID ${reg.athleteId} no es válido o no pertenece a tu equipo.` });

                    if (!reg.weightClass.startsWith(athleteExists.gender)) {
                        throw new TRPCError({ code: "BAD_REQUEST", message: `La categoría ${reg.weightClass} no corresponde al género de ${athleteExists.fullName}.` });
                    }

                    const existing = await tx.query.registrations.findFirst({
                        where: and(
                            eq(registrations.athleteId, reg.athleteId),
                            eq(registrations.tournamentId, input.tournamentId),
                            isNull(registrations.deletedAt)
                        )
                    });

                    if (existing) continue;

                    await tx.insert(registrations).values({
                        ...reg,
                        tournamentId: input.tournamentId,
                        teamId: team.id,
                        status: "pending",
                    });
                }
            });
        }),

    byTeam: protectedProcedure
        .query(async ({ ctx }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) throw new TRPCError({
                code: "NOT_FOUND",
                message: "No se encontró un equipo asociado a tu cuenta.",
            });

            return await ctx.db.query.registrations.findMany({
                where: and(eq(registrations.teamId, team.id), isNull(registrations.deletedAt)),
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
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            }

            // Verify ownership
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.id, input.id),
                    eq(registrations.teamId, team.id),
                    isNull(registrations.deletedAt)
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
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            }

            // Verify ownership
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.id, input.id),
                    eq(registrations.teamId, team.id),
                    isNull(registrations.deletedAt)
                )
            });

            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            }

            return ctx.db.update(registrations)
                .set({ deletedAt: new Date() })
                .where(eq(registrations.id, input.id));
        }),
} satisfies TRPCRouterRecord;
