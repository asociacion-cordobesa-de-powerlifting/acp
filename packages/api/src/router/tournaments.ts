import { tournament, user } from "@acme/db/schema";
import { adminProcedure, protectedProcedure } from "../trpc";
import { or, ne, eq, desc, and, sql, not, isNull } from "@acme/db";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { tournamentValidator } from "@acme/shared/validators";
import { z } from "zod";
import { cleanAndLowercase } from '@acme/shared'
import { dayjs } from '@acme/shared/libs'


export const tournamentsRouter = {

    all: adminProcedure
        .input(z.object({
            onlyRoots: z.boolean().optional().default(false),
            includeSubEvents: z.boolean().optional().default(false),
        }).optional())
        .query(async ({ ctx, input }) => {
            return ctx.db.query.tournament.findMany({
                where: and(
                    isNull(tournament.deletedAt),
                    input?.onlyRoots ? isNull(tournament.parentId) : undefined
                ),
                orderBy: [desc(tournament.createdAt)],
                with: input?.includeSubEvents ? { subEvents: true } : undefined,
            });
        }),

    list: protectedProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.tournament.findMany({
                orderBy: [desc(tournament.createdAt)],
                where: and(
                    isNull(tournament.deletedAt),
                    isNull(tournament.parentId),
                    not(eq(tournament.status, 'finished'))
                ),
                with: { subEvents: true }
            });
        }),

    create: adminProcedure
        .input(tournamentValidator)
        .mutation(async ({ ctx, input }) => {
            const slug = cleanAndLowercase(input.name);
            const existing = await ctx.db.query.tournament.findFirst({
                where: and(
                    eq(tournament.slug, slug),
                    isNull(tournament.deletedAt)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro torneo con el mismo nombre'
                });
            }

            const newTournament = await ctx.db.insert(tournament).values({
                ...input,
                slug,
            });

            return newTournament;
        }),

    update: adminProcedure
        .input(tournamentValidator.and(z.object({
            id: z.string().uuid(),
            propagateLogistics: z.boolean().optional()
        })))
        .mutation(async ({ ctx, input }) => {
            const { id, propagateLogistics, ...data } = input;
            const slug = cleanAndLowercase(data.name);

            const existing = await ctx.db.query.tournament.findFirst({
                where: and(
                    eq(tournament.slug, slug),
                    ne(tournament.id, id),
                    isNull(tournament.deletedAt)
                )
            });

            if (existing) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Ya hay otro torneo con el mismo nombre'
                });
            }

            return await ctx.db.transaction(async (tx) => {
                await tx.update(tournament).set({
                    ...data,
                    slug,
                }).where(eq(tournament.id, id));

                if (propagateLogistics) {
                    await tx.update(tournament).set({
                        venue: data.venue,
                        location: data.location,
                        startDate: data.startDate,
                        endDate: data.endDate,
                    }).where(eq(tournament.parentId, id));
                }
            });
        }),

    createInstances: adminProcedure
        .input(z.object({
            parentId: z.string().uuid(),
            modalities: z.array(z.object({
                equipment: z.enum(['classic', 'equipped']),
                event: z.enum(['full', 'bench']),
                division: z.enum(['subjunior', 'junior', 'open', 'master_1', 'master_2', 'master_3', 'master_4']),
                maxAthletes: z.number().nullable().optional(),
            }))
        }))
        .mutation(async ({ ctx, input }) => {
            const parent = await ctx.db.query.tournament.findFirst({
                where: eq(tournament.id, input.parentId)
            });

            if (!parent) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Torneo padre no encontrado'
                });
            }

            return await ctx.db.transaction(async (tx) => {
                for (const mod of input.modalities) {
                    const name = `${parent.name} - ${mod.equipment} ${mod.event} ${mod.division}`;
                    const slug = `${parent.slug}-${mod.equipment}-${mod.event}-${mod.division}`;

                    // Check if instance already exists
                    const existing = await tx.query.tournament.findFirst({
                        where: and(
                            eq(tournament.slug, slug),
                            isNull(tournament.deletedAt)
                        )
                    });

                    if (existing) continue;

                    await tx.insert(tournament).values({
                        name,
                        slug,
                        parentId: parent.id,
                        venue: parent.venue,
                        location: parent.location,
                        startDate: parent.startDate,
                        endDate: parent.endDate,
                        status: parent.status,
                        division: mod.division,
                        event: mod.event,
                        equipment: mod.equipment,
                        maxAthletes: mod.maxAthletes ?? parent.maxAthletes,
                    });
                }
            });
        }),

    delete: adminProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            await ctx.db.transaction(async (tx) => {
                await tx.update(tournament)
                    .set({ deletedAt: now })
                    .where(eq(tournament.id, input.id));

                await tx.update(tournament)
                    .set({ deletedAt: now })
                    .where(eq(tournament.parentId, input.id));
            });
        }),

} satisfies TRPCRouterRecord;