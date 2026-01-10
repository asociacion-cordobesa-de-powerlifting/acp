import { tournament, user, event, athlete, registrations } from "@acme/db/schema";
import { adminProcedure, protectedProcedure, publicProcedure } from "../trpc";
import { or, ne, eq, desc, and, sql, not, isNull, isNotNull } from "@acme/db";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { tournamentValidator, eventValidator, baseEventSchema } from "@acme/shared/validators";
import { z } from "zod";
import { cleanAndLowercase, generateShortId } from '@acme/shared'
import { deleteReceiptsByPaths } from '../lib/storage'


export const tournamentsRouter = {

    // Public endpoint - no auth required
    publicList: publicProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.event.findMany({
                where: isNull(event.deletedAt),
                orderBy: [desc(event.startDate)],
                with: {
                    tournaments: {
                        where: isNull(tournament.deletedAt),
                    }
                }
            });
        }),

    allEvents: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.event.findMany({
                where: isNull(event.deletedAt),
                orderBy: [desc(event.createdAt)],
                with: { tournaments: true }
            });
        }),

    createEvent: adminProcedure
        .input(eventValidator)
        .mutation(async ({ ctx, input }) => {
            const slug = cleanAndLowercase(input.name);
            const existing = await ctx.db.query.event.findFirst({
                where: and(
                    eq(event.slug, slug),
                    isNull(event.deletedAt)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro evento con el mismo nombre'
                });
            }

            const [newEvent] = await ctx.db.insert(event).values({
                ...input,
                slug,
                shortId: generateShortId(),
            }).returning();

            return newEvent;
        }),

    createEventWithTournaments: adminProcedure
        .input(z.object({
            event: eventValidator,
            modalities: z.array(z.object({
                equipment: z.enum(['classic', 'equipped']),
                modality: z.enum(['full', 'bench']),
                division: z.enum(['juniors', 'open', 'masters']),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const { event: eventData, modalities } = input;
            const eventSlug = cleanAndLowercase(eventData.name);

            // Check event slug uniqueness
            const existingEvent = await ctx.db.query.event.findFirst({
                where: and(
                    eq(event.slug, eventSlug),
                    isNull(event.deletedAt)
                )
            });

            if (existingEvent) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro evento con el mismo nombre y slug'
                });
            }

            return await ctx.db.transaction(async (tx) => {
                // 1. Create Event
                const [newEvent] = await tx.insert(event).values({
                    ...eventData,
                    slug: eventSlug,
                    shortId: generateShortId(),
                }).returning();

                if (!newEvent) {
                    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo crear el evento' });
                }

                // 2. Create Tournaments
                for (const mod of modalities) {
                    const tournamentSlug = `${eventSlug}-${mod.modality}-${mod.equipment}-${mod.division}`;
                    const shortId = generateShortId();

                    await tx.insert(tournament).values({
                        eventId: newEvent.id,
                        division: mod.division,
                        modality: mod.modality,
                        equipment: mod.equipment,
                        slug: tournamentSlug,
                        shortId,
                    });
                }

                return newEvent;
            });
        }),

    createTournaments: adminProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            modalities: z.array(z.object({
                equipment: z.enum(['classic', 'equipped']),
                modality: z.enum(['full', 'bench']),
                division: z.enum(['juniors', 'open', 'masters']),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const targetEvent = await ctx.db.query.event.findFirst({
                where: eq(event.id, input.eventId)
            });

            if (!targetEvent) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Evento no encontrado'
                });
            }

            return await ctx.db.transaction(async (tx) => {
                const eventSlug = targetEvent.slug;

                for (const mod of input.modalities) {
                    // Check if tournament already exists for this event
                    const existing = await tx.query.tournament.findFirst({
                        where: and(
                            eq(tournament.eventId, input.eventId),
                            eq(tournament.modality, mod.modality),
                            eq(tournament.equipment, mod.equipment),
                            eq(tournament.division, mod.division),
                            isNull(tournament.deletedAt)
                        )
                    });

                    if (existing) continue;

                    const tournamentSlug = `${eventSlug}-${mod.modality}-${mod.equipment}-${mod.division}`;
                    const shortId = generateShortId();

                    await tx.insert(tournament).values({
                        eventId: input.eventId,
                        division: mod.division,
                        modality: mod.modality,
                        equipment: mod.equipment,
                        slug: tournamentSlug,
                        shortId,
                    });
                }
            });
        }),

    updateEvent: adminProcedure
        .input(baseEventSchema.extend({
            id: z.string().uuid(),
            propagateStatus: z.enum(['preliminary_open', 'preliminary_closed', 'finished']).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, propagateStatus, ...data } = input;
            const slug = cleanAndLowercase(data.name);

            // Check uniqueness
            const existing = await ctx.db.query.event.findFirst({
                where: and(
                    eq(event.slug, slug),
                    ne(event.id, id),
                    isNull(event.deletedAt)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'El nombre del evento ya está en uso'
                });
            }

            return await ctx.db.transaction(async (tx) => {
                const [updated] = await tx.update(event)
                    .set({ ...data, slug })
                    .where(eq(event.id, id))
                    .returning();

                // If slug changed, update all tournament slugs
                const tournaments = await tx.query.tournament.findMany({
                    where: eq(tournament.eventId, id)
                });

                for (const t of tournaments) {
                    const newTournamentSlug = `${slug}-${t.modality}-${t.equipment}-${t.division}`;
                    await tx.update(tournament)
                        .set({ slug: newTournamentSlug })
                        .where(eq(tournament.id, t.id));
                }

                if (propagateStatus) {
                    // If propagating 'finished' status, delete all receipts for this event
                    if (propagateStatus === 'finished') {
                        // Get all registrations with receipts for tournaments in this event
                        const tournamentIds = tournaments.map(t => t.id)
                        const regsWithReceipts = await tx.query.registrations.findMany({
                            where: and(
                                sql`${registrations.tournamentId} = ANY(ARRAY[${sql.raw(tournamentIds.map(id => `'${id}'`).join(','))}]::uuid[])`,
                                isNotNull(registrations.paymentReceiptUrl)
                            )
                        })

                        // Delete files from storage
                        const paths = regsWithReceipts
                            .map(r => r.paymentReceiptUrl)
                            .filter((p): p is string => !!p)
                        await deleteReceiptsByPaths(paths)

                        // Clear receipt URLs in database
                        if (tournamentIds.length > 0) {
                            await tx.update(registrations)
                                .set({ paymentReceiptUrl: null })
                                .where(sql`${registrations.tournamentId} = ANY(ARRAY[${sql.raw(tournamentIds.map(id => `'${id}'`).join(','))}]::uuid[])`)
                        }
                    }

                    await tx.update(tournament)
                        .set({ status: propagateStatus })
                        .where(eq(tournament.eventId, id));
                }

                return updated;
            });
        }),

    list: protectedProcedure
        .query(async ({ ctx }) => {
            const data = await ctx.db.query.tournament.findMany({
                where: isNull(tournament.deletedAt),
                with: {
                    event: true
                }
            });
            return data.map(t => ({
                ...t,
                name: t.event.name,
                venue: t.event.venue,
                location: t.event.location,
                startDate: t.event.startDate,
                endDate: t.event.endDate,
            }));
        }),

    update: adminProcedure
        .input(z.object({
            id: z.string().uuid(),
            division: z.enum(['juniors', 'open', 'masters']).optional(),
            modality: z.enum(['full', 'bench']).optional(),
            equipment: z.enum(['classic', 'equipped']).optional(),
            status: z.enum(['preliminary_open', 'preliminary_closed', 'finished']).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existingTournament = await ctx.db.query.tournament.findFirst({
                where: eq(tournament.id, id),
                with: { event: true }
            });

            if (!existingTournament) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Torneo no encontrado' });
            }

            let slug = existingTournament.slug;
            if (data.division || data.modality || data.equipment) {
                const div = data.division ?? existingTournament.division;
                const mod = data.modality ?? existingTournament.modality;
                const eqpt = data.equipment ?? existingTournament.equipment;
                slug = `${existingTournament.event.slug}-${mod}-${eqpt}-${div}`;

                // Check collision
                const collision = await ctx.db.query.tournament.findFirst({
                    where: and(
                        eq(tournament.slug, slug),
                        ne(tournament.id, id),
                        isNull(tournament.deletedAt)
                    )
                });

                if (collision) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe una modalidad con estos mismos atributos para este evento' });
                }
            }

            // If changing status to 'finished', delete all receipts for this tournament
            if (data.status === 'finished' && existingTournament.status !== 'finished') {
                // Get registrations with receipts
                const regsWithReceipts = await ctx.db.query.registrations.findMany({
                    where: and(
                        eq(registrations.tournamentId, id),
                        isNotNull(registrations.paymentReceiptUrl)
                    )
                })

                // Delete files from storage
                const paths = regsWithReceipts
                    .map(r => r.paymentReceiptUrl)
                    .filter((p): p is string => !!p)
                await deleteReceiptsByPaths(paths)

                // Clear receipt URLs in database
                await ctx.db.update(registrations)
                    .set({ paymentReceiptUrl: null })
                    .where(eq(registrations.tournamentId, id))
            }

            const [updated] = await ctx.db.update(tournament)
                .set({ ...data, slug } as any)
                .where(eq(tournament.id, id))
                .returning();
            return updated;
        }),

    deleteEvent: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            await ctx.db.transaction(async (tx) => {
                await tx.update(event)
                    .set({ deletedAt: now })
                    .where(eq(event.id, input.id));

                await tx.update(tournament)
                    .set({ deletedAt: now })
                    .where(eq(tournament.eventId, input.id));
            });
        }),

    delete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            await ctx.db.update(tournament)
                .set({ deletedAt: now })
                .where(eq(tournament.id, input.id));
        }),

    stats: adminProcedure
        .query(async ({ ctx }) => {
            // Count teams (users with role 'user')
            const teams = await ctx.db.query.user.findMany({
                where: eq(user.role, 'user'),
            });
            const totalTeams = teams.length;

            // Count events
            const events = await ctx.db.query.event.findMany({
                where: isNull(event.deletedAt),
            });
            const totalEvents = events.length;

            // Count tournaments
            const tournaments = await ctx.db.query.tournament.findMany({
                where: isNull(tournament.deletedAt),
            });
            const totalTournaments = tournaments.length;

            // Count registrations by status
            const allRegistrations = await ctx.db.query.registrations.findMany({
                where: isNull(registrations.deletedAt),
            });
            const totalRegistrations = allRegistrations.length;
            const pendingRegistrations = allRegistrations.filter(r => r.status === 'pending').length;
            const approvedRegistrations = allRegistrations.filter(r => r.status === 'approved').length;
            const rejectedRegistrations = allRegistrations.filter(r => r.status === 'rejected').length;

            // Count athletes (from all teams)
            const athletes = await ctx.db.query.athlete.findMany({
                where: isNull(athlete.deletedAt),
            });
            const totalAthletes = athletes.length;

            // Get active tournaments (preliminary_open)
            const activeTournaments = tournaments.filter(t => t.status === 'preliminary_open').length;

            return {
                totalTeams,
                totalEvents,
                totalTournaments,
                activeTournaments,
                totalRegistrations,
                pendingRegistrations,
                approvedRegistrations,
                rejectedRegistrations,
                totalAthletes,
            };
        }),

} satisfies TRPCRouterRecord;