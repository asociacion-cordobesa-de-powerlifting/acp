import { z } from "zod/v4";
import { createInsertSchema } from "drizzle-zod";
import { tournament, athlete } from "@acme/db/schema";

export const tournamentValidator = createInsertSchema(tournament, {
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    venue: z.string().min(3, "La sede debe tener al menos 3 caracteres"),
    location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
    maxAthletes: z.number().min(8, "Debe haber al menos 8 atletas").nullable(),
    startDate: z.date({ message: "La fecha de inicio es requerida" }),
    endDate: z.date({ message: "La fecha de fin es requerida" }),
}).omit({ slug: true }).refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
});

export const athleteValidator = createInsertSchema(athlete, {
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    dni: z.string().min(6, "El DNI debe ser válido"),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
    gender: z.enum(["M", "F"]),
}).omit({
    id: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});