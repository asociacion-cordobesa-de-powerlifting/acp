import { z } from "zod/v4";
import { createInsertSchema } from "drizzle-zod";
import { tournament, athlete, registrations, weightClassEnum, divisionEnum, eventEnum, tournamentStatusEnum } from "@acme/db/schema";
// import type { WeightClassEnum, AthleteDivisionEnum } from "@acme/db/schema";

export const tournamentValidator = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    venue: z.string().min(3, "La sede debe tener al menos 3 caracteres"),
    location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
    maxAthletes: z.number().min(8, "Debe haber al menos 8 atletas").nullable(),
    startDate: z.date({ message: "La fecha de inicio es requerida" }),
    endDate: z.date({ message: "La fecha de fin es requerida" }),
    status: z.enum(tournamentStatusEnum.enumValues, { message: "Estado inválido" }),
}).refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la fecha de inicio",
    path: ["endDate"],
})

// export const tournamentValidator = createInsertSchema(tournament, {
//     name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
//     venue: z.string().min(3, "La sede debe tener al menos 3 caracteres"),
//     location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
//     maxAthletes: z.number().min(8, "Debe haber al menos 8 atletas").nullable(),
//     startDate: z.date({ message: "La fecha de inicio es requerida" }),
//     endDate: z.date({ message: "La fecha de fin es requerida" }),
// }).omit({ slug: true }).refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
//     message: "La fecha de fin no puede ser anterior a la fecha de inicio",
//     path: ["endDate"],
// });

export const athleteValidator = createInsertSchema(athlete, {
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    dni: z.string().min(6, "El DNI debe tener al menos 6 caracteres"),
    birthYear: z.number({ message: "Ingrese un año válido" }).int().min(1900, "Año inválido").max(new Date().getFullYear(), "Año inválido"),
    gender: z.enum(["M", "F"], { message: "Seleccione un género válido" }),
}).omit({
    id: true,
    teamId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});

export const registrationValidator = createInsertSchema(registrations, {
    athleteId: z.string({ message: "Seleccione un atleta" }).uuid("Seleccione un atleta válido"),
    tournamentId: z.string({ message: "Seleccione un torneo" }).uuid("Seleccione un torneo válido"),
    weightClass: z.enum(weightClassEnum.enumValues, { message: "Categoría de peso inválida" }),
    division: z.enum(divisionEnum.enumValues, { message: "División inválida" }),
    event: z.enum(eventEnum.enumValues, { message: "Evento inválido" }),
    squatOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    benchOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    deadliftOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
}).omit({
    id: true,
    teamId: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
});

export const updateRegistrationSchema = z.object({
    id: z.string().uuid(),
    weightClass: z.enum(weightClassEnum.enumValues, { message: "Categoría de peso inválida" }),
    division: z.enum(divisionEnum.enumValues, { message: "División inválida" }),
    event: z.enum(eventEnum.enumValues, { message: "Evento inválido" }),
    squatOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    benchOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    deadliftOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
});