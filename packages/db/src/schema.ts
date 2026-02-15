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
  isAffiliated: t.boolean('is_affiliated').default(false).notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: t.timestamp(), // borrado lógico
}));

export const teamDataRelations = relations(teamData, ({ one, many }) => ({
  athletes: many(athlete),
  registrations: many(registrations),
  coaches: many(coach),
  user: one(user, {
    fields: [teamData.userId],
    references: [user.id],
  }),
}));


export const event = pgTable("event", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  shortId: t.varchar("short_id").notNull().unique(),
  name: t.text().notNull(), // Ej: "Campeonato Nacional 2026"
  slug: t.text().notNull(), // Unique constraint handled by partial index below
  venue: t.text().notNull(),
  location: t.text().notNull(),
  startDate: t.timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: t.timestamp('end_date', { withTimezone: true }).notNull(),
  resultsUrl: t.text('results_url'), // URL to results PDF in public bucket
  descriptionAffiliates: t.text('description_affiliates'), // Descripción para equipos afiliados
  descriptionNonAffiliates: t.text('description_non_affiliates'), // Descripción para equipos no afiliados

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp(),
}), (table) => [
  // Partial unique index: slug must be unique only for active (non-deleted) events
  {
    name: "event_slug_active_unique",
    columns: [table.slug],
    unique: true,
    where: sql`${table.deletedAt} IS NULL`,
  },
]);

export const eventRelations = relations(event, ({ many }) => ({
  tournaments: many(tournament),
  coachRegistrations: many(coachEventRegistration),
  referees: many(eventReferee),
}));

// Torneos
export const tournament = pgTable("tournament", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  eventId: t.uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  shortId: t.varchar("short_id").notNull().unique(),
  slug: t.text().notNull(), // Unique constraint handled by partial index below

  // Atributos específicos de la modalidad
  division: tournamentDivisionEnum("division").notNull().default("open"),
  modality: modalityEnum("modality").notNull().default("full"),
  equipment: equipmentEnum("equipment").notNull().default("classic"),
  status: tournamentStatusEnum("status").notNull().default("preliminary_open"),

  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp().notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp(),
}), (table) => [
  // Partial unique index: slug must be unique only for active (non-deleted) tournaments
  {
    name: "tournament_slug_active_unique",
    columns: [table.slug],
    unique: true,
    where: sql`${table.deletedAt} IS NULL`,
  },
]);

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
}), (table) => [
  {
    name: "athlete_team_dni_active_unique",
    columns: [table.teamId, table.dni],
    unique: true,
    where: sql`${table.deletedAt} IS NULL`,
  },
]);

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


/* ========== COACHES & REFEREES ========== */

export const refereeCategoryEnum = pgEnum("referee_category", [
  "national",
  "int_cat_1",
  "int_cat_2"
]);

export const coachRoleEnum = pgEnum("coach_role", [
  "head_coach",
  "assistant_coach"
]);

// Coaches (pertenecen a un equipo)
export const coach = pgTable("coach", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  teamId: t.uuid("team_id").notNull().references(() => teamData.id, { onDelete: "cascade" }),
  fullName: t.text("full_name").notNull(),
  dni: t.text().notNull(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp("deleted_at"),
}));

export const coachRelations = relations(coach, ({ one, many }) => ({
  team: one(teamData, {
    fields: [coach.teamId],
    references: [teamData.id],
  }),
  eventRegistrations: many(coachEventRegistration),
}));

// Registro de coaches a eventos
export const coachEventRegistration = pgTable("coach_event_registration", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  coachId: t.uuid("coach_id").notNull().references(() => coach.id, { onDelete: "cascade" }),
  eventId: t.uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  role: coachRoleEnum("role").notNull().default("head_coach"),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  deletedAt: t.timestamp("deleted_at"),
}));

export const coachEventRegistrationRelations = relations(coachEventRegistration, ({ one }) => ({
  coach: one(coach, {
    fields: [coachEventRegistration.coachId],
    references: [coach.id],
  }),
  event: one(event, {
    fields: [coachEventRegistration.eventId],
    references: [event.id],
  }),
}));

// Referees (pool global)
export const referee = pgTable("referee", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  fullName: t.text("full_name").notNull(),
  dni: t.text().notNull().unique(),
  category: refereeCategoryEnum("category").notNull(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").notNull().$onUpdate(() => new Date()),
  deletedAt: t.timestamp("deleted_at"),
}));

export const refereeRelations = relations(referee, ({ many }) => ({
  eventAssignments: many(eventReferee),
}));

// Asignación de referees a eventos
export const eventReferee = pgTable("event_referee", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  refereeId: t.uuid("referee_id").notNull().references(() => referee.id, { onDelete: "cascade" }),
  eventId: t.uuid("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  deletedAt: t.timestamp("deleted_at"),
}));

export const eventRefereeRelations = relations(eventReferee, ({ one }) => ({
  referee: one(referee, {
    fields: [eventReferee.refereeId],
    references: [referee.id],
  }),
  event: one(event, {
    fields: [eventReferee.eventId],
    references: [event.id],
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
export type RefereeCategoryEnum = typeof refereeCategoryEnum.enumValues[number]
export type CoachRoleEnum = typeof coachRoleEnum.enumValues[number]
