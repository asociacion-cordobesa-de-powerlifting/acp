import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, publicProcedure } from "../trpc";
import { referee, eventReferee, event } from "@acme/db/schema";
import { eq, desc, and, isNull } from "@acme/db";

const refereeValidator = z.object({
    fullName: z.string().min(1, "Nombre completo requerido"),
    dni: z.string().min(1, "DNI requerido"),
    category: z.enum(["national", "int_cat_1", "int_cat_2"]),
});

export const refereesRouter = {

    // List all referees (admin only)
    list: adminProcedure.query(async ({ ctx }) => {
        return ctx.db.query.referee.findMany({
            where: isNull(referee.deletedAt),
            orderBy: [desc(referee.createdAt)],
        });
    }),

    // Create a referee (admin only)
    create: adminProcedure
        .input(refereeValidator)
        .mutation(async ({ ctx, input }) => {
            // Check if referee with same DNI already exists
            const existingReferee = await ctx.db.query.referee.findFirst({
                where: and(
                    eq(referee.dni, input.dni),
                    isNull(referee.deletedAt)
                )
            });

            if (existingReferee) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: `Ya existe un referee con DNI ${input.dni}.`,
                });
            }

            const [newReferee] = await ctx.db.insert(referee).values(input).returning();

            return newReferee;
        }),

    // Update a referee (admin only)
    update: adminProcedure
        .input(refereeValidator.and(z.object({ id: z.string().uuid() })))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;

            const existing = await ctx.db.query.referee.findFirst({
                where: and(eq(referee.id, id), isNull(referee.deletedAt))
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Referee no encontrado.",
                });
            }

            // Check if DNI is being changed and already exists
            if (data.dni && data.dni !== existing.dni) {
                const dniExists = await ctx.db.query.referee.findFirst({
                    where: and(
                        eq(referee.dni, data.dni),
                        isNull(referee.deletedAt)
                    )
                });

                if (dniExists) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: `Ya existe un referee con DNI ${data.dni}.`,
                    });
                }
            }

            await ctx.db.update(referee).set(data).where(eq(referee.id, id));

            return existing;
        }),

    // Delete a referee (admin only, soft delete)
    delete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.db.query.referee.findFirst({
                where: and(eq(referee.id, input.id), isNull(referee.deletedAt))
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Referee no encontrado.",
                });
            }

            await ctx.db.update(referee).set({ deletedAt: new Date() }).where(eq(referee.id, input.id));
        }),

    // Get referees assigned to an event (public)
    byEvent: publicProcedure
        .input(z.object({ eventId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const assignments = await ctx.db.query.eventReferee.findMany({
                where: and(
                    eq(eventReferee.eventId, input.eventId),
                    isNull(eventReferee.deletedAt)
                ),
                with: {
                    referee: true
                }
            });

            // Category order: int_cat_1 (1), int_cat_2 (2), national (3)
            const categoryOrder: Record<string, number> = {
                int_cat_1: 1,
                int_cat_2: 2,
                national: 3,
            };

            // Filter to only include non-deleted referees and sort by category
            return assignments
                .filter(a => !a.referee.deletedAt)
                .map(a => ({
                    id: a.id,
                    refereeId: a.referee.id,
                    fullName: a.referee.fullName,
                    category: a.referee.category,
                }))
                .sort((a, b) => (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99));
        }),

    // Assign a referee to an event (admin only)
    assignToEvent: adminProcedure
        .input(z.object({
            refereeId: z.string().uuid(),
            eventId: z.string().uuid()
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify referee exists
            const refereeRecord = await ctx.db.query.referee.findFirst({
                where: and(eq(referee.id, input.refereeId), isNull(referee.deletedAt))
            });

            if (!refereeRecord) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Referee no encontrado.",
                });
            }

            // Verify event exists
            const eventRecord = await ctx.db.query.event.findFirst({
                where: and(eq(event.id, input.eventId), isNull(event.deletedAt))
            });

            if (!eventRecord) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Evento no encontrado.",
                });
            }

            // Check if already assigned
            const existing = await ctx.db.query.eventReferee.findFirst({
                where: and(
                    eq(eventReferee.refereeId, input.refereeId),
                    eq(eventReferee.eventId, input.eventId),
                    isNull(eventReferee.deletedAt)
                )
            });

            if (existing) {
                return existing;
            }

            const [assignment] = await ctx.db.insert(eventReferee).values({
                refereeId: input.refereeId,
                eventId: input.eventId,
            }).returning();

            return assignment;
        }),

    // Remove a referee from an event (admin only)
    removeFromEvent: adminProcedure
        .input(z.object({
            refereeId: z.string().uuid(),
            eventId: z.string().uuid()
        }))
        .mutation(async ({ ctx, input }) => {
            const assignment = await ctx.db.query.eventReferee.findFirst({
                where: and(
                    eq(eventReferee.refereeId, input.refereeId),
                    eq(eventReferee.eventId, input.eventId),
                    isNull(eventReferee.deletedAt)
                )
            });

            if (!assignment) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Asignación no encontrada.",
                });
            }

            await ctx.db.update(eventReferee)
                .set({ deletedAt: new Date() })
                .where(eq(eventReferee.id, assignment.id));
        }),

    // Sync referees for an event (admin only)
    syncEventReferees: adminProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            refereeIds: z.array(z.string().uuid())
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify event exists
            const eventRecord = await ctx.db.query.event.findFirst({
                where: and(eq(event.id, input.eventId), isNull(event.deletedAt))
            });

            if (!eventRecord) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Evento no encontrado.",
                });
            }

            // Get current assignments
            const currentAssignments = await ctx.db.query.eventReferee.findMany({
                where: and(
                    eq(eventReferee.eventId, input.eventId),
                    isNull(eventReferee.deletedAt)
                )
            });

            const currentRefereeIds = new Set(currentAssignments.map(a => a.refereeId));
            const newRefereeIds = new Set(input.refereeIds);

            // Remove referees no longer in the list
            for (const assignment of currentAssignments) {
                if (!newRefereeIds.has(assignment.refereeId)) {
                    await ctx.db.update(eventReferee)
                        .set({ deletedAt: new Date() })
                        .where(eq(eventReferee.id, assignment.id));
                }
            }

            // Add new referees
            for (const refereeId of input.refereeIds) {
                if (!currentRefereeIds.has(refereeId)) {
                    // Verify referee exists
                    const refereeRecord = await ctx.db.query.referee.findFirst({
                        where: and(eq(referee.id, refereeId), isNull(referee.deletedAt))
                    });

                    if (refereeRecord) {
                        await ctx.db.insert(eventReferee).values({
                            refereeId,
                            eventId: input.eventId,
                        });
                    }
                }
            }
        }),

} satisfies TRPCRouterRecord;
