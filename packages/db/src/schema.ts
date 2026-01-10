import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "./auth-schema";

export const genderEnum = pgEnum("gender", ["M", "F"]);

export const weightClassEnum = pgEnum("weight_class", [
  "F_CAT43",
  "F_CAT47",
  "F_CAT52",
  "F_CAT57",
  "F_CAT63",
  "F_CAT69",
  "F_CAT76",
  "F_CAT84",
  "F_CATHW",

  "M_CAT53",
  "M_CAT59",
  "M_CAT66",
  "M_CAT74",
  "M_CAT83",
  "M_CAT93",
  "M_CAT105",
  "M_CAT120",
  "M_CATHW",
]);

export const divisionEnum = pgEnum("division", [
  "subjunior",
  "junior",
  "open",
  "master_1",
  "master_2",
  "master_3",
  "master_4",
]);

export const modalityEnum = pgEnum("modality", [
  "full",
  "bench"
]);

export const equipmentEnum = pgEnum('equipment', [
  "classic",
  "equipped"
])

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "preliminary_open",
  "preliminary_closed",
  "finished",
]);

export const tournamentDivisionEnum = pgEnum("tournament_division", [
  "juniors",
  "open",
  "masters"
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "approved",
  "rejected",
]);


/* ========== ACP SCHEMA ========== */

// Equipos
export const teamData = pgTable("team_data", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  slug: t.text().notNull().unique(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(), // borrado lógico
}));

export const teamDataRelations = relations(teamData, ({ one, many }) => ({
  athletes: many(athlete),
  registrations: many(registrations),
  user: one(user, {
    fields: [teamData.userId],
    references: [user.id],
  }),
}));


export const event = pgTable("event", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  shortId: t.varchar("short_id").notNull().unique(),
  name: t.text().notNull(), // Ej: "Campeonato Nacional 2026"
  slug: t.text().notNull().unique(),
  venue: t.text().notNull(),
  location: t.text().notNull(),
  startDate: t.timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: t.timestamp('end_date', { withTimezone: true }).notNull(),
  resultsUrl: t.text('results_url'), // URL to results PDF in public bucket

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp(),
}));

export const eventRelations = relations(event, ({ many }) => ({
  tournaments: many(tournament),
}));

// Torneos
export const tournament = pgTable("tournament", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  eventId: t.uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  shortId: t.varchar("short_id").notNull().unique(),
  slug: t.text().notNull().unique(),

  // Atributos específicos de la modalidad
  division: tournamentDivisionEnum("division").notNull().default("open"),
  modality: modalityEnum("modality").notNull().default("full"),
  equipment: equipmentEnum("equipment").notNull().default("classic"),
  status: tournamentStatusEnum("status").notNull().default("preliminary_open"),

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp(),
}));

export const tournamentRelations = relations(tournament, ({ one, many }) => ({
  event: one(event, {
    fields: [tournament.eventId],
    references: [event.id],
  }),
  registrations: many(registrations),
}));

// Atletas (no son usuarios)
export const athlete = pgTable("athlete", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  teamId: t
    .uuid()
    .notNull()
    .references(() => teamData.id, { onDelete: "cascade" }),
  fullName: t.text().notNull(),
  dni: t.text().notNull(),
  birthYear: t.integer().notNull(),
  gender: genderEnum("gender").notNull(),
  goodliftRef: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(),
  squatBestKg: t.real().notNull(),
  benchBestKg: t.real().notNull(),
  deadliftBestKg: t.real().notNull(),
}));

export const athleteRelations = relations(athlete, ({ one, many }) => ({
  team: one(teamData, {
    fields: [athlete.teamId],
    references: [teamData.id],
  }),
  registrations: many(registrations),
}));

// Inscripciones (nómina preliminar)
export const registrations = pgTable("registrations", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),

  tournamentId: t
    .uuid()
    .notNull()
    .references(() => tournament.id, { onDelete: "cascade" }),

  teamId: t
    .uuid()
    .notNull()
    .references(() => teamData.id, { onDelete: "cascade" }),

  athleteId: t
    .uuid()
    .notNull()
    .references(() => athlete.id, { onDelete: "cascade" }),

  weightClass: weightClassEnum("weight_class").notNull(),

  status: registrationStatusEnum("status").notNull(),

  paymentReceiptUrl: t.text("payment_receipt_url"),

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(),
}));

export const registrationRelations = relations(registrations, ({ one, many }) => ({
  athlete: one(athlete, {
    fields: [registrations.athleteId],
    references: [athlete.id],
  }),
  tournament: one(tournament, {
    fields: [registrations.tournamentId],
    references: [tournament.id],
  }),
  team: one(teamData, {
    fields: [registrations.teamId],
    references: [teamData.id],
  }),
}));


export * from "./auth-schema";

export type TournamentStatusEnum = typeof tournamentStatusEnum.enumValues[number]
export type DivisionEnum = typeof divisionEnum.enumValues[number]
export type TournamentDivisionEnum = typeof tournamentDivisionEnum.enumValues[number]
export type WeightClassEnum = typeof weightClassEnum.enumValues[number]
export type ModalityEnum = typeof modalityEnum.enumValues[number]
export type EquipmentEnum = typeof equipmentEnum.enumValues[number]
export type GenderEnum = typeof genderEnum.enumValues[number]
export type RegistrationStatusEnum = typeof registrationStatusEnum.enumValues[number]
