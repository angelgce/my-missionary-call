import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const userAdmin = pgTable('user_admin', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  ipAddress: text('ip_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  guestName: text('guest_name').notNull().default(''),
  country: text('country').notNull(),
  countryCode: text('country_code').notNull(),
  state: text('state').notNull(),
  stateCode: text('state_code').notNull(),
  city: text('city').notNull(),
  sessionId: text('session_id').notNull(),
  latitude: text('latitude'),
  longitude: text('longitude'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adviceBox = pgTable('advice_box', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  guestName: text('guest_name').notNull().default(''),
  advice: text('advice').notNull(),
  sessionId: text('session_id').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revelation = pgTable('revelation', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionaryName: text('missionary_name').notNull().default(''),
  missionaryAddress: text('missionary_address').notNull().default(''),
  missionName: text('mission_name').notNull(),
  language: text('language').notNull(),
  trainingCenter: text('training_center').notNull(),
  entryDate: text('entry_date').notNull(),
  pdfText: text('pdf_text').notNull().default(''),
  normalizedPdfText: text('normalized_pdf_text').notNull().default(''),
  isRevealed: boolean('is_revealed').default(false).notNull(),
  openingDate: text('opening_date').default(''),
  locationAddress: text('location_address').default(''),
  locationUrl: text('location_url').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
