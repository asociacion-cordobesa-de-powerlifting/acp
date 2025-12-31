import { z } from "zod/v4";
import { tournament, athlete, registrations, weightClassEnum, tournamentDivisionEnum, modalityEnum, tournamentStatusEnum, equipmentEnum, genderEnum } from "@acme/db/schema";
import { dayjs } from "./lib";

export const baseEventSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    venue: z.string().min(3, "La sede debe tener al menos 3 caracteres"),
    location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
    startDate: z.date({ message: "La fecha de inicio es requerida" }),
    endDate: z.date({ message: "La fecha de fin es requerida" }),
});

export const eventValidator = baseEventSchema.refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la fecha de inicio",
    path: ["endDate"],
});

export const tournamentValidator = z.object({
    eventId: z.string().uuid("ID de evento inválido"),
    division: z.enum(tournamentDivisionEnum.enumValues, { message: "División inválida" }),
    modality: z.enum(modalityEnum.enumValues, { message: "Modalidad inválida" }),
    equipment: z.enum(equipmentEnum.enumValues, { message: "Equipamiento inválido" }),
    status: z.enum(tournamentStatusEnum.enumValues, { message: "Estado inválido" }).optional(),
});

export const athleteValidator = z.object({
    fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    dni: z.string().min(6, "El DNI debe tener al menos 6 caracteres"),
    birthYear: z.number({ message: "Ingrese un año válido" }).int().min(1900, "Año inválido").max(dayjs().year(), "Año inválido"),
    gender: z.enum(genderEnum.enumValues, { message: "Seleccione un género válido" }),
    goodliftRef: z.string().optional().nullable(),
    squatBestKg: z.number({ message: "La mejor sentadilla es requerida" }).min(0, "Debe ser mayor o igual a 0"),
    benchBestKg: z.number({ message: "El mejor banco es requerido" }).min(0, "Debe ser mayor o igual a 0"),
    deadliftBestKg: z.number({ message: "El mejor despegue es requerido" }).min(0, "Debe ser mayor o igual a 0"),
});

export const registrationValidator = z.object({
    athleteId: z.uuid("Seleccione un atleta válido"),
    tournamentId: z.uuid("Seleccione un torneo válido"),
    weightClass: z.enum(weightClassEnum.enumValues, { message: "Categoría de peso inválida" }),
    squatOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    benchOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    deadliftOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
});

export const updateRegistrationSchema = z.object({
    id: z.uuid(),
    weightClass: z.enum(weightClassEnum.enumValues, { message: "Categoría de peso inválida" }),
    squatOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    benchOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
    deadliftOpenerKg: z.number().min(0, "Debe ser mayor a 0").nullable(),
});