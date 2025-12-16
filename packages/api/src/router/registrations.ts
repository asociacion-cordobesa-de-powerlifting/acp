import { z } from "zod";
import { protectedProcedure } from "../trpc";
import { registrations, registrationStatusEnum, tournament, athlete, teamData } from "@acme/db/schema";
import { TRPCRouterRecord, TRPCError } from "@trpc/server";
import { eq, and } from "@acme/db";
import { registrationValidator } from "@acme/shared/validators";

export const registrationsRouter = {
    create: protectedProcedure
        .input(registrationValidator)
        .mutation(async ({ ctx, input }) => {
            // 1. Get Team ID
            const team = await ctx.db.query.teamData.findFirst({
                where: eq(teamData.userId, ctx.session.user.id)
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
                    eq(athlete.teamId, team.id)
                )
            });

            if (!athleteExists) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "El atleta no pertenece a tu equipo.",
                });
            }

            // 3. Verify Tournament Status (optional but good practice)
            const tournamentExists = await ctx.db.query.tournament.findFirst({
                where: eq(tournament.id, input.tournamentId)
            });

            if (!tournamentExists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Torneo no encontrado.",
                });
            }

            // 4. Check if already registered
            const existing = await ctx.db.query.registrations.findFirst({
                where: and(
                    eq(registrations.athleteId, input.athleteId),
                    eq(registrations.tournamentId, input.tournamentId)
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
} satisfies TRPCRouterRecord;
