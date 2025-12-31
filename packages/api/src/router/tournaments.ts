import { tournament, user, event } from "@acme/db/schema";
import { adminProcedure, protectedProcedure } from "../trpc";
import { or, ne, eq, desc, and, sql, not, isNull } from "@acme/db";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { tournamentValidator, eventValidator, baseEventSchema } from "@acme/shared/validators";
import { z } from "zod";
import { cleanAndLowercase } from '@acme/shared'


export const tournamentsRouter = {

    allEvents: adminProcedure
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
            }).returning();

            return newEvent;
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

                    await tx.insert(tournament).values({
                        eventId: input.eventId,
                        division: mod.division,
                        modality: mod.modality,
                        equipment: mod.equipment,
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

            return await ctx.db.transaction(async (tx) => {
                const [updated] = await tx.update(event)
                    .set({ ...data, slug })
                    .where(eq(event.id, id))
                    .returning();

                if (propagateStatus) {
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
            const [updated] = await ctx.db.update(tournament)
                .set(data as any)
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

} satisfies TRPCRouterRecord;