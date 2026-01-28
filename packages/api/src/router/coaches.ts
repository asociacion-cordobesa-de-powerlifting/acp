import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, adminProcedure } from "../trpc";
import { coach, coachEventRegistration, teamData, event } from "@acme/db/schema";
import { eq, desc, and, isNull } from "@acme/db";

const coachValidator = z.object({
    fullName: z.string().min(1, "Nombre completo requerido"),
    dni: z.string().min(1, "DNI requerido"),
});

export const coachesRouter = {

    // List coaches for the current user's team
    list: protectedProcedure.query(async ({ ctx }) => {
        const team = await ctx.db.query.teamData.findFirst({
            where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
        });

        if (!team) {
            return [];
        }

        return ctx.db.query.coach.findMany({
            where: and(eq(coach.teamId, team.id), isNull(coach.deletedAt)),
            orderBy: [desc(coach.createdAt)],
        });
    }),

    // Create a coach for the current user's team
    create: protectedProcedure
        .input(coachValidator)
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

            // Check if coach with same DNI already exists in this team
            const existingCoach = await ctx.db.query.coach.findFirst({
                where: and(
                    eq(coach.teamId, team.id),
                    eq(coach.dni, input.dni),
                    isNull(coach.deletedAt)
                )
            });

            if (existingCoach) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: `Ya existe un coach con DNI ${input.dni} en tu equipo.`,
                });
            }

            const [newCoach] = await ctx.db.insert(coach).values({
                ...input,
                teamId: team.id,
            }).returning();

            return newCoach;
        }),

    // Update a coach
    update: protectedProcedure
        .input(coachValidator.and(z.object({ id: z.string().uuid() })))
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

            const existing = await ctx.db.query.coach.findFirst({
                where: and(
                    eq(coach.id, id),
                    eq(coach.teamId, team.id),
                    isNull(coach.deletedAt)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coach no encontrado.",
                });
            }

            // Check if DNI is being changed and already exists
            if (data.dni && data.dni !== existing.dni) {
                const dniExists = await ctx.db.query.coach.findFirst({
                    where: and(
                        eq(coach.teamId, team.id),
                        eq(coach.dni, data.dni),
                        isNull(coach.deletedAt)
                    )
                });

                if (dniExists) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: `Ya existe un coach con DNI ${data.dni} en tu equipo.`,
                    });
                }
            }

            await ctx.db.update(coach).set(data).where(eq(coach.id, id));

            return existing;
        }),

    // Delete a coach (soft delete)
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

            const existing = await ctx.db.query.coach.findFirst({
                where: and(
                    eq(coach.id, input.id),
                    eq(coach.teamId, team.id),
                    isNull(coach.deletedAt)
                )
            });

            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coach no encontrado.",
                });
            }

            await ctx.db.update(coach).set({ deletedAt: new Date() }).where(eq(coach.id, input.id));
        }),

    // Get coaches registered to an event (for the current user's team)
    byEvent: protectedProcedure
        .input(z.object({ eventId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: and(eq(teamData.userId, ctx.session.user.id), isNull(teamData.deletedAt))
            });

            if (!team) {
                return [];
            }

            const registrations = await ctx.db.query.coachEventRegistration.findMany({
                where: and(
                    eq(coachEventRegistration.eventId, input.eventId),
                    isNull(coachEventRegistration.deletedAt)
                ),
                with: {
                    coach: true
                }
            });

            // Filter to only include coaches from this team
            return registrations.filter(r => r.coach.teamId === team.id && !r.coach.deletedAt);
        }),

    // Register a coach to an event
    registerToEvent: protectedProcedure
        .input(z.object({
            coachId: z.string().uuid(),
            eventId: z.string().uuid(),
            role: z.enum(["head_coach", "assistant_coach"]).default("head_coach")
        }))
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

            // Verify coach belongs to team
            const coachRecord = await ctx.db.query.coach.findFirst({
                where: and(
                    eq(coach.id, input.coachId),
                    eq(coach.teamId, team.id),
                    isNull(coach.deletedAt)
                )
            });

            if (!coachRecord) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coach no encontrado.",
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

            // Check if already registered
            const existing = await ctx.db.query.coachEventRegistration.findFirst({
                where: and(
                    eq(coachEventRegistration.coachId, input.coachId),
                    eq(coachEventRegistration.eventId, input.eventId),
                    isNull(coachEventRegistration.deletedAt)
                )
            });

            if (existing) {
                // Update role if already registered
                await ctx.db.update(coachEventRegistration)
                    .set({ role: input.role })
                    .where(eq(coachEventRegistration.id, existing.id));
                return existing;
            }

            const [registration] = await ctx.db.insert(coachEventRegistration).values({
                coachId: input.coachId,
                eventId: input.eventId,
                role: input.role,
            }).returning();

            return registration;
        }),

    // Remove a coach from an event
    removeFromEvent: protectedProcedure
        .input(z.object({
            coachId: z.string().uuid(),
            eventId: z.string().uuid()
        }))
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

            // Verify coach belongs to team
            const coachRecord = await ctx.db.query.coach.findFirst({
                where: and(
                    eq(coach.id, input.coachId),
                    eq(coach.teamId, team.id),
                    isNull(coach.deletedAt)
                )
            });

            if (!coachRecord) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Coach no encontrado.",
                });
            }

            const registration = await ctx.db.query.coachEventRegistration.findFirst({
                where: and(
                    eq(coachEventRegistration.coachId, input.coachId),
                    eq(coachEventRegistration.eventId, input.eventId),
                    isNull(coachEventRegistration.deletedAt)
                )
            });

            if (!registration) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Registro no encontrado.",
                });
            }

            await ctx.db.update(coachEventRegistration)
                .set({ deletedAt: new Date() })
                .where(eq(coachEventRegistration.id, registration.id));
        }),

    // Sync coaches for an event (similar to athlete registrations sync)
    syncEventCoaches: protectedProcedure
        .input(z.object({
            eventId: z.string().uuid(),
            coaches: z.array(z.object({
                coachId: z.string().uuid(),
                role: z.enum(["head_coach", "assistant_coach"])
            }))
        }))
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

            // Get current registrations for this team's coaches
            const currentRegistrations = await ctx.db.query.coachEventRegistration.findMany({
                where: and(
                    eq(coachEventRegistration.eventId, input.eventId),
                    isNull(coachEventRegistration.deletedAt)
                ),
                with: { coach: true }
            });

            const teamRegistrations = currentRegistrations.filter(r => r.coach.teamId === team.id);
            const currentCoachIds = new Set(teamRegistrations.map(r => r.coachId));
            const newCoachIds = new Set(input.coaches.map(c => c.coachId));

            // Remove coaches no longer in the list
            for (const reg of teamRegistrations) {
                if (!newCoachIds.has(reg.coachId)) {
                    await ctx.db.update(coachEventRegistration)
                        .set({ deletedAt: new Date() })
                        .where(eq(coachEventRegistration.id, reg.id));
                }
            }

            // Add or update coaches
            for (const coachData of input.coaches) {
                const existingReg = teamRegistrations.find(r => r.coachId === coachData.coachId);

                if (existingReg) {
                    // Update role if changed
                    if (existingReg.role !== coachData.role) {
                        await ctx.db.update(coachEventRegistration)
                            .set({ role: coachData.role })
                            .where(eq(coachEventRegistration.id, existingReg.id));
                    }
                } else {
                    // Verify coach belongs to team
                    const coachRecord = await ctx.db.query.coach.findFirst({
                        where: and(
                            eq(coach.id, coachData.coachId),
                            eq(coach.teamId, team.id),
                            isNull(coach.deletedAt)
                        )
                    });

                    if (coachRecord) {
                        await ctx.db.insert(coachEventRegistration).values({
                            coachId: coachData.coachId,
                            eventId: input.eventId,
                            role: coachData.role,
                        });
                    }
                }
            }
        }),

    // Get all coaches registered to an event (public - for event page and admin)
    publicByEvent: publicProcedure
        .input(z.object({ eventId: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const registrations = await ctx.db.query.coachEventRegistration.findMany({
                where: and(
                    eq(coachEventRegistration.eventId, input.eventId),
                    isNull(coachEventRegistration.deletedAt)
                ),
                with: {
                    coach: {
                        with: {
                            team: {
                                with: {
                                    user: {
                                        columns: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Filter to only include non-deleted coaches and return formatted data
            return registrations
                .filter(r => !r.coach.deletedAt)
                .map(r => ({
                    id: r.id,
                    coachId: r.coach.id,
                    fullName: r.coach.fullName,
                    dni: r.coach.dni,
                    role: r.role,
                    teamId: r.coach.teamId,
                    teamSlug: r.coach.team?.slug || 'unknown',
                    teamName: r.coach.team?.user?.name || r.coach.team?.slug || 'Sin equipo',
                }));
        }),

    // Admin remove a coach from an event
    adminRemoveFromEvent: adminProcedure
        .input(z.object({
            registrationId: z.string().uuid()
        }))
        .mutation(async ({ ctx, input }) => {
            const registration = await ctx.db.query.coachEventRegistration.findFirst({
                where: and(
                    eq(coachEventRegistration.id, input.registrationId),
                    isNull(coachEventRegistration.deletedAt)
                )
            });

            if (!registration) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Registro no encontrado.",
                });
            }

            await ctx.db.update(coachEventRegistration)
                .set({ deletedAt: new Date() })
                .where(eq(coachEventRegistration.id, input.registrationId));
        }),

} satisfies TRPCRouterRecord;
