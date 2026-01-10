import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure } from "../trpc";
import { registrations, tournament, athlete, teamData, weightClassEnum, event, registrationStatusEnum } from "@acme/db/schema";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq, and, isNull, inArray, desc } from "@acme/db";
import { registrationValidator, updateRegistrationSchema } from "@acme/shared/validators";
import { canAthleteParticipateIn, getEligibleWeightClasses } from "@acme/shared";

export const registrationsRouter = {
    // Public endpoint - get event details with approved registrations by event slug
    publicByEventSlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ ctx, input }) => {
            // Find event by slug
            const eventData = await ctx.db.query.event.findFirst({
                where: and(eq(event.slug, input.slug), isNull(event.deletedAt)),
                with: {
                    tournaments: {
                        where: isNull(tournament.deletedAt),
                    }
                }
            });

            if (!eventData) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });
            }

            const tournamentIds = eventData.tournaments.map(t => t.id);

            if (tournamentIds.length === 0) {
                return {
                    event: eventData,
                    registrations: [],
                };
            }

            // Get all approved registrations for this event
            const allRegistrations = await ctx.db.query.registrations.findMany({
                where: and(
                    inArray(registrations.tournamentId, tournamentIds),
                    eq(registrations.status, 'approved'),
                    isNull(registrations.deletedAt)
                ),
                with: {
                    athlete: true,
                    tournament: true,
                    team: { with: { user: true } }
                },
                orderBy: [desc(registrations.createdAt)],
            });

            // Return only public info (no DNI, no payment receipts)
            return {
                event: eventData,
                registrations: allRegistrations.map(r => ({
                    id: r.id,
                    tournamentId: r.tournamentId,
                    weightClass: r.weightClass,
                    tournament: {
                        id: r.tournament.id,
                        division: r.tournament.division,
                        modality: r.tournament.modality,
                        equipment: r.tournament.equipment,
                        status: r.tournament.status,
                    },
                    athlete: {
                        id: r.athlete.id,
                        fullName: r.athlete.fullName,
                        birthYear: r.athlete.birthYear,
                        gender: r.athlete.gender,
                        squatBestKg: r.athlete.squatBestKg,
                        benchBestKg: r.athlete.benchBestKg,
                        deadliftBestKg: r.athlete.deadliftBestKg,
                    },
                    teamName: r.team.user.name,
                })),
            };
        }),

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

    syncEventRegistrationsAdmin: adminProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            teamId: z.string().uuid(),
            nominations: z.array(z.object({
                athleteId: z.string().uuid(),
                tournamentId: z.string().uuid(), // Base tournament ID (division correspondiente)
                weightClass: z.enum(weightClassEnum.enumValues),
                divisionMode: z.enum(["division_only", "open_only", "both"]),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify team exists
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.id, input.teamId), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado." });

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
                    // Verify athlete belongs to team
                    const athleteExists = await tx.query.athlete.findFirst({
                        where: and(eq(athlete.id, nom.athleteId), eq(athlete.teamId, team.id), isNull(athlete.deletedAt))
                    });
                    if (!athleteExists) continue; // Skip if athlete doesn't belong to team

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

    updatePaymentReceipt: protectedProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            athleteId: z.string().uuid(),
            receiptUrl: z.string().nullable(), // Now stores path, not URL
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes un equipo asociado." });

            // Get all tournament IDs for this event
            const eventTournaments = await ctx.db.query.tournament.findMany({
                where: and(eq(tournament.eventId, input.eventId), isNull(tournament.deletedAt)),
            });

            if (!eventTournaments.length) throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });

            const eventTournamentIds = eventTournaments.map(t => t.id);

            // Update all registrations for this athlete in any tournament of this event
            const result = await ctx.db.update(registrations)
                .set({ paymentReceiptUrl: input.receiptUrl })
                .where(and(
                    eq(registrations.athleteId, input.athleteId),
                    eq(registrations.teamId, team.id),
                    inArray(registrations.tournamentId, eventTournamentIds),
                    isNull(registrations.deletedAt)
                ))
                .returning();

            if (result.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "No se encontraron inscripciones para actualizar." });
            }

            return { updated: result.length };
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

    byTeamAndEvent: adminProcedure
        .input(z.object({ teamId: z.string().uuid(), eventId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Verify team exists
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.id, input.teamId), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "Equipo no encontrado." });

            // Get all tournaments for this event
            const eventTournaments = await ctx.db.query.tournament.findMany({
                where: and(eq(tournament.eventId, input.eventId), isNull(tournament.deletedAt)),
            });

            if (eventTournaments.length === 0) {
                return [];
            }

            const tournamentIds = eventTournaments.map(t => t.id);

            return await ctx.db.query.registrations.findMany({
                where: and(
                    eq(registrations.teamId, team.id),
                    inArray(registrations.tournamentId, tournamentIds),
                    isNull(registrations.deletedAt)
                ),
                with: { athlete: true, tournament: { with: { event: true } } },
                orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
            });
        }),

    teamStats: protectedProcedure
        .query(async ({ ctx }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });
            if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró un equipo asociado a tu cuenta." });

            // Count athletes
            const athletes = await ctx.db.query.athlete.findMany({
                where: and(eq(athlete.teamId, team.id), isNull(athlete.deletedAt)),
            });
            const totalAthletes = athletes.length;

            // Count registrations by status
            const allRegistrations = await ctx.db.query.registrations.findMany({
                where: and(eq(registrations.teamId, team.id), isNull(registrations.deletedAt)),
            });
            const totalRegistrations = allRegistrations.length;
            const pendingRegistrations = allRegistrations.filter(r => r.status === 'pending').length;
            const approvedRegistrations = allRegistrations.filter(r => r.status === 'approved').length;
            const rejectedRegistrations = allRegistrations.filter(r => r.status === 'rejected').length;

            return {
                totalAthletes,
                totalRegistrations,
                pendingRegistrations,
                approvedRegistrations,
                rejectedRegistrations,
            };
        }),

    byEvent: adminProcedure
        .input(z.object({ eventId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            // Verify event exists
            const eventExists = await ctx.db.query.event.findFirst({
                where: and(eq(event.id, input.eventId), isNull(event.deletedAt))
            });
            if (!eventExists) throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });

            // Get all tournaments for this event
            const eventTournaments = await ctx.db.query.tournament.findMany({
                where: and(eq(tournament.eventId, input.eventId), isNull(tournament.deletedAt)),
            });

            if (eventTournaments.length === 0) {
                return [];
            }

            const tournamentIds = eventTournaments.map(t => t.id);

            // Get all registrations for these tournaments
            return await ctx.db.query.registrations.findMany({
                where: and(
                    inArray(registrations.tournamentId, tournamentIds),
                    isNull(registrations.deletedAt)
                ),
                with: {
                    athlete: true,
                    tournament: { with: { event: true } },
                    team: { with: { user: true } }
                },
                orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
            });
        }),

    all: adminProcedure
        .input(z.object({ eventId: z.string().uuid().optional() }))
        .query(async ({ ctx, input }) => {
            if (input.eventId) {
                // Filter by event (server-side)
                const eventExists = await ctx.db.query.event.findFirst({
                    where: and(eq(event.id, input.eventId), isNull(event.deletedAt))
                });
                if (!eventExists) throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });

                const eventTournaments = await ctx.db.query.tournament.findMany({
                    where: and(eq(tournament.eventId, input.eventId), isNull(tournament.deletedAt)),
                });

                if (eventTournaments.length === 0) {
                    return [];
                }

                const tournamentIds = eventTournaments.map(t => t.id);

                return await ctx.db.query.registrations.findMany({
                    where: and(
                        inArray(registrations.tournamentId, tournamentIds),
                        isNull(registrations.deletedAt)
                    ),
                    with: {
                        athlete: true,
                        tournament: { with: { event: true } },
                        team: { with: { user: true } }
                    },
                    orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
                });
            }

            // Get all registrations (no filter)
            return await ctx.db.query.registrations.findMany({
                where: isNull(registrations.deletedAt),
                with: {
                    athlete: true,
                    tournament: { with: { event: true } },
                    team: { with: { user: true } }
                },
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

    updateStatus: adminProcedure
        .input(z.object({
            id: z.string().uuid(),
            status: z.enum(registrationStatusEnum.enumValues),
        }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(eq(registrations.id, input.id), isNull(registrations.deletedAt))
            });
            if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Inscripción no encontrada." });
            return ctx.db.update(registrations).set({ status: input.status }).where(eq(registrations.id, input.id));
        }),

    updateStatusBulk: adminProcedure
        .input(z.object({
            ids: z.array(z.string().uuid()),
            status: z.enum(registrationStatusEnum.enumValues),
        }))
        .mutation(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "No se proporcionaron inscripciones para actualizar." });
            }
            return ctx.db.update(registrations)
                .set({ status: input.status })
                .where(and(
                    inArray(registrations.id, input.ids),
                    isNull(registrations.deletedAt)
                ));
        }),
} satisfies TRPCRouterRecord;
