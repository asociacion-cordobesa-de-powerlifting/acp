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

export const eventEnum = pgEnum("event", [
  "full",
  "bench"
]);

export const equipmentEnum = pgEnum('equipment', [
  "raw",
  "equipped"
])

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "preliminary_open",
  "preliminary_closed",
  "finished",
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

// Torneos
export const tournament = pgTable("tournament", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  name: t.text().notNull(),
  slug: t.text().notNull().unique(),
  venue: t.text().notNull(),
  location: t.text().notNull(),
  startDate: t.timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: t.timestamp('end_date', { withTimezone: true }).notNull(),
  status: tournamentStatusEnum("status").notNull(),
  maxAthletes: t.integer(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(),
}));

// Atletas (no son usuarios)
export const athlete = pgTable("athlete", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  teamId: t
    .uuid()
    .notNull()
    .references(() => teamData.id),
  fullName: t.text().notNull(),
  dni: t.text().notNull(),
  birthYear: t.integer().notNull(),
  gender: genderEnum("gender").notNull(),
  goodliftRef: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(),
}));

// Inscripciones (nómina preliminar)
export const registrations = pgTable("registrations", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),

  tournamentId: t
    .uuid()
    .notNull()
    .references(() => tournament.id),

  teamId: t
    .uuid()
    .notNull()
    .references(() => teamData.id),

  athleteId: t
    .uuid()
    .notNull()
    .references(() => athlete.id),

  weightClass: weightClassEnum("weight_class").notNull(),
  division: divisionEnum("division").notNull(),
  event: eventEnum("event").notNull(),

  squatOpenerKg: t.real(),
  benchOpenerKg: t.real(),
  deadliftOpenerKg: t.real(),

  status: registrationStatusEnum("status").notNull(),

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
}));


export * from "./auth-schema";

export type TournamentStatusEnum = typeof tournamentStatusEnum.enumValues[number]
export type DivisionEnum = typeof divisionEnum.enumValues[number]
export type WeightClassEnum = typeof weightClassEnum.enumValues[number]
export type EventEnum = typeof eventEnum.enumValues[number]
export type EquipmentEnum = typeof equipmentEnum.enumValues[number]
