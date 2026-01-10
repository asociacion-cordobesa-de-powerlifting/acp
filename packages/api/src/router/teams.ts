import { adminProcedure, protectedProcedure, publicProcedure } from "../trpc";
import { teamData, user, athlete } from "@acme/db/schema";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { or, ne, eq, desc, isNull, count } from "@acme/db";
import z from "zod";

export const teamsRouter = {
    // Public endpoint - no auth required
    publicList: publicProcedure
        .query(async ({ ctx }) => {
            const teams = await ctx.db.query.teamData.findMany({
                where: isNull(teamData.deletedAt),
                with: {
                    user: true,
                    athletes: {
                        where: isNull(athlete.deletedAt),
                    }
                },
                orderBy: [desc(teamData.createdAt)],
            });

            // Return only public info
            return teams.map(team => ({
                id: team.id,
                name: team.user.name,
                slug: team.slug,
                athleteCount: team.athletes.length,
            }));
        }),

    list: protectedProcedure
        .query(async ({ ctx }) => {

            // const users = await ctx.authApi.listUsers({
            //     headers: ctx.headers,
            //     query: {},
            // })

            // console.log('better-auth users api plugin', users)

            return ctx.db.query.user.findMany({
                where: or(ne(user.role, "admin"), eq(user.role, 'user')),
                orderBy: [desc(user.createdAt)],
            });
        }),

    create: adminProcedure
        .input(z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            isAffiliated: z.boolean().optional().default(false),
        }))
        .mutation(async ({ ctx, input }) => {

            let userId;
            try {
                const { user } = await ctx.authApi.createUser({
                    body: {
                        name: input.name,
                        email: input.email,
                        password: input.password,
                        data: {
                            username: input.name,
                        }
                    },
                });
                userId = user.id;

            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create user',
                })
            }

            // Create team data
            return await ctx.db.insert(teamData).values({
                userId,
                slug: input.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                isAffiliated: input.isAffiliated,
            });
        }),

    update: adminProcedure
        .input(z.object({
            teamId: z.string().uuid(),
            isAffiliated: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.id, input.teamId),
            });

            if (!team) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Equipo no encontrado',
                });
            }

            await ctx.db.update(teamData)
                .set({ isAffiliated: input.isAffiliated })
                .where(eq(teamData.id, input.teamId));

            return { success: true };
        }),

    listWithTeamData: adminProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.teamData.findMany({
                where: isNull(teamData.deletedAt),
                with: { user: true },
                orderBy: [desc(teamData.createdAt)],
            });
        }),

    // Get current team's own data (for team dashboard)
    myData: protectedProcedure
        .query(async ({ ctx }) => {
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id),
            });

            if (!team) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Equipo no encontrado',
                });
            }

            return team;
        }),
} satisfies TRPCRouterRecord;
