import { z } from "zod/v4";
import { createInsertSchema } from "drizzle-zod";
import { tournament } from "@acme/db/schema";

export const tournamentValidator = createInsertSchema(tournament).required({
    name: true,
    venue: true,
    location: true,
    startDate: true,
    endDate: true,
    status: true,
    maxAthletes: true,
});