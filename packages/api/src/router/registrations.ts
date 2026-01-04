import { z } from "zod";
import { protectedProcedure } from "../trpc";
import { registrations, tournament, athlete, teamData, weightClassEnum } from "@acme/db/schema";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq, and, isNull, inArray } from "@acme/db";
import { registrationValidator, updateRegistrationSchema } from "@acme/shared/validators";
import { canAthleteParticipateIn, getEligibleWeightClasses } from "@acme/shared";

export const registrationsRouter = {
    create: protectedProcedure
        .input(registrationValidator)
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });

            const athleteExists = await ctx.db.query.athlete.findFirst({
                where: and(eq(athlete.id, input.athleteId), eq(athlete.teamId, team.id), isNull(athlete.deletedAt))
            });
            if (!athleteExists) throw new TRPCError({ code: "FORBIDDEN", message: "El atleta no pertenece a tu equipo." });

            const tournamentExists = await ctx.db.query.tournament.findFirst({
                where: and(eq(tournament.id, input.tournamentId), isNull(tournament.deletedAt))
            });
            if (!tournamentExists) throw new TRPCError({ code: "NOT_FOUND", message: "Torneo no encontrado." });
            if (tournamentExists.status !== 'preliminary_open') throw new TRPCError({ code: "BAD_REQUEST", message: "El torneo no está abierto para inscripciones." });

            if (!canAthleteParticipateIn(athleteExists.birthYear, tournamentExists.division as any)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `El atleta no puede participar en la división ${tournamentExists.division} por su edad.` });
            }

            const eligibleWeights = getEligibleWeightClasses({ gender: athleteExists.gender as any, birthYear: athleteExists.birthYear }, tournamentExists as any);
            if (!eligibleWeights.includes(input.weightClass)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `La categoría ${input.weightClass} no es válida para el atleta según su edad y género.` });
            }

            const existing = await ctx.db.query.registrations.findFirst({
                where: and(eq(registrations.athleteId, input.athleteId), eq(registrations.tournamentId, input.tournamentId), isNull(registrations.deletedAt))
            });
            if (existing) throw new TRPCError({ code: "CONFLICT", message: "El atleta ya está inscrito en este torneo." });

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
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });

            const t = await ctx.db.query.tournament.findFirst({
                where: and(eq(tournament.id, input.tournamentId), isNull(tournament.deletedAt))
            });
            if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Torneo no encontrado." });
            if (t.status !== 'preliminary_open') throw new TRPCError({ code: "BAD_REQUEST", message: "El torneo no está abierto para inscripciones." });

            return await ctx.db.transaction(async (tx) => {
                for (const reg of input.registrations) {
                    const a = await tx.query.athlete.findFirst({
                        where: and(eq(athlete.id, reg.athleteId), eq(athlete.teamId, team.id), isNull(athlete.deletedAt))
                    });
                    if (!a) throw new TRPCError({ code: "BAD_REQUEST", message: `Atleta inválido o no pertenece a tu equipo.` });

                    if (!canAthleteParticipateIn(a.birthYear, t.division as any)) throw new TRPCError({ code: "BAD_REQUEST", message: `El atleta ${a.fullName} no puede participar en la división ${t.division} por su edad.` });

                    const eligibleWeights = getEligibleWeightClasses({ gender: a.gender as any, birthYear: a.birthYear }, t as any);
                    if (!eligibleWeights.includes(reg.weightClass)) throw new TRPCError({ code: "BAD_REQUEST", message: `La categoría ${reg.weightClass} no es válida para ${a.fullName} según su edad y género.` });

                    const existing = await tx.query.registrations.findFirst({
                        where: and(eq(registrations.athleteId, reg.athleteId), eq(registrations.tournamentId, input.tournamentId), isNull(registrations.deletedAt))
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

    syncEventRegistrations: protectedProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            nominations: z.array(z.object({
                athleteId: z.string().uuid(),
                tournamentId: z.string().uuid(), // Base tournament ID (division correspondiente)
                weightClass: z.enum(weightClassEnum.enumValues),
                divisionMode: z.enum(["division_only", "open_only", "both"]),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });

            const eventWithTournaments = await ctx.db.query.tournament.findMany({
                where: and(eq(tournament.eventId, input.eventId), isNull(tournament.deletedAt)),
            });

            if (!eventWithTournaments.length) throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado o sin torneos." });

            const eventTournamentIds = eventWithTournaments.map(t => t.id);

            return await ctx.db.transaction(async (tx) => {
                const existingRegistrations = await tx.query.registrations.findMany({
                    where: and(
                        isNull(registrations.deletedAt),
                        eq(registrations.teamId, team.id),
                        inArray(registrations.tournamentId, eventTournamentIds)
                    ),
                    with: { tournament: true }
                });

                const processedRegistrationIds = new Set<string>();

                for (const nom of input.nominations) {
                    const tournamentsToSync: string[] = [];
                    const mainT = eventWithTournaments.find(t => t.id === nom.tournamentId);
                    
                    if (!mainT) continue; // Skip if tournament not found
                    
                    if (nom.divisionMode === "open_only") {
                        // Only register in Open division
                        const openT = eventWithTournaments.find(t =>
                            t.division === 'open' &&
                            t.modality === mainT.modality &&
                            t.equipment === mainT.equipment
                        );
                        if (openT) tournamentsToSync.push(openT.id);
                    } else if (nom.divisionMode === "both") {
                        // Register in both divisions
                        tournamentsToSync.push(nom.tournamentId);
                        if (mainT.division !== 'open') {
                            const openT = eventWithTournaments.find(t =>
                                t.division === 'open' &&
                                t.modality === mainT.modality &&
                                t.equipment === mainT.equipment
                            );
                            if (openT) tournamentsToSync.push(openT.id);
                        }
                    } else {
                        // division_only: only register in the main division
                        tournamentsToSync.push(nom.tournamentId);
                    }

                    for (const tid of tournamentsToSync) {
                        const existing = existingRegistrations.find(r => r.athleteId === nom.athleteId && r.tournamentId === tid);

                        if (!existing) {
                            const [newReg] = await tx.insert(registrations).values({
                                athleteId: nom.athleteId,
                                tournamentId: tid,
                                weightClass: nom.weightClass,
                                teamId: team.id,
                                status: "pending",
                            }).returning();
                            if (newReg) processedRegistrationIds.add(newReg.id);
                        } else {
                            if (existing.status === 'pending' && existing.weightClass !== nom.weightClass) {
                                await tx.update(registrations)
                                    .set({ weightClass: nom.weightClass })
                                    .where(eq(registrations.id, existing.id));
                            }
                            processedRegistrationIds.add(existing.id);
                        }
                    }
                }

                // Delete pending registrations that were not in the nomination list (within this event)
                const regsToDelete = existingRegistrations.filter(r =>
                    r.status === 'pending' && !processedRegistrationIds.has(r.id)
                );

                if (regsToDelete.length > 0) {
                    await tx.delete(registrations)
                        .where(inArray(registrations.id, regsToDelete.map(r => r.id)));
                }
            });
        }),

    byTeam: protectedProcedure
        .query(async ({ ctx }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró un equipo asociado a tu cuenta." });
            return await ctx.db.query.registrations.findMany({
                where: and(eq(registrations.teamId, team.id), isNull(registrations.deletedAt)),
                with: { athlete: true, tournament: { with: { event: true } } },
                orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
            });
        }),

    update: protectedProcedure
        .input(updateRegistrationSchema)
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(eq(registrations.id, input.id), eq(registrations.teamId, team.id), isNull(registrations.deletedAt))
            });
            if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            return ctx.db.update(registrations).set({ weightClass: input.weightClass }).where(eq(registrations.id, input.id));
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(eq(registrations.id, input.id), eq(registrations.teamId, team.id), isNull(registrations.deletedAt))
            });
            if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            return ctx.db.update(registrations).set({ deletedAt: new Date() }).where(eq(registrations.id, input.id));
        }),
} satisfies TRPCRouterRecord;
