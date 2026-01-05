import { adminProcedure, protectedProcedure } from "../trpc";
import { teamData, user } from "@acme/db/schema";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { or, ne, eq, desc, isNull } from "@acme/db";
import z from "zod";

export const teamsRouter = {
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
            });
        }),

    listWithTeamData: adminProcedure
        .query(async ({ ctx }) => {
            return ctx.db.query.teamData.findMany({
                where: isNull(teamData.deletedAt),
                with: { user: true },
                orderBy: [desc(teamData.createdAt)],
            });
        }),
} satisfies TRPCRouterRecord;
