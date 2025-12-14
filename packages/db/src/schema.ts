import { sql } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "./auth-schema";

export const genderEnum = pgEnum("gender", ["M", "F"]);

export const weightClassEnum = pgEnum("weight_class", [
  "F_CAT44",
  "F_CAT48",
  "F_CAT52",
  "F_CAT56",
  "F_CAT60",
  "F_CAT67",
  "F_CAT75",
  "F_CAT82",
  "F_CAT90",
  "F_CATHW",
  "M_CAT52",
  "M_CAT56",
  "M_CAT60",
  "M_CAT67",
  "M_CAT75",
  "M_CAT82",
  "M_CAT90",
  "M_CAT100",
  "M_CAT110",
  "M_CAT125",
  "M_CAT140",
  "M_CATHW",
]);

export const divisionEnum = pgEnum("division", ["Open", "Teen", "Subjunior"]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
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
  updatedAt: t.timestamp().notNull().$onUpdateFn(() => sql`now()`),
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
  updatedAt: t.timestamp().notNull().$onUpdateFn(() => sql`now()`),
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
  birthYear: t.integer(),
  gender: genderEnum("gender").notNull(),
  goodliftRef: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdateFn(() => sql`now()`),
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

  squatOpenerKg: t.real().notNull(),
  benchOpenerKg: t.real().notNull(),
  deadliftOpenerKg: t.real().notNull(),

  status: registrationStatusEnum("status").notNull(),

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdateFn(() => sql`now()`),
  deletedAt: t.timestamp(),
}));


export * from "./auth-schema";

export type TournamentStatusEnum = typeof tournamentStatusEnum.enumValues[number]