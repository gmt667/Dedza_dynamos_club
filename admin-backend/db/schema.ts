import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const clubUpdates = sqliteTable("club_updates", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  audience: text("audience", { enum: ["public", "members"] }).notNull().default("public"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const staffProfiles = sqliteTable("staff_profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["owner", "editor", "viewer"] }).notNull().default("viewer"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  // Display info
  shirtNumber: text("shirt_number"),           // e.g. "09" — nullable
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  // Role / classification
  position: text("position", {
    enum: ["goalkeeper", "defender", "midfielder", "forward"],
  }).notNull(),
  squadRole: text("squad_role"),               // e.g. "2023 Golden Boot", "Captain", "Loan"
  // Background
  nationality: text("nationality"),            // e.g. "Malawian"
  bio: text("bio"),                            // short description shown on the squad card
  photoUrl: text("photo_url"),                 // relative or absolute URL to portrait image
  // Status & ordering
  status: text("status", {
    enum: ["active", "historical", "loan", "injured"],
  }).notNull().default("active"),
  displayOrder: integer("display_order").notNull().default(999), // lower = shown first
  // Timestamps
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").default("14:30"),
  home: text("home").notNull(),
  away: text("away").notNull(),
  venue: text("venue").notNull(),
  competition: text("competition").notNull(),
  status: text("status", {
    enum: ["upcoming", "full_time", "postponed"],
  }).notNull().default("upcoming"),
  score: text("score").default(""),
  round: text("round"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const partners = sqliteTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  tier: text("tier", {
    enum: ["platinum", "gold", "silver", "commercial"],
  }).notNull().default("commercial"),
  status: text("status", {
    enum: ["active", "inactive"],
  }).notNull().default("active"),
  url: text("url"),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["video", "photo"],
  }).notNull().default("photo"),
  category: text("category").notNull().default("highlights"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  date: text("date"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clubSettings = sqliteTable("club_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(), // e.g. "DD-2026-0842"
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  tier: text("tier", { enum: ["yellow", "silver", "gold"] }).notNull().default("yellow"),
  district: text("district").notNull().default("Dedza"),
  passwordHash: text("password_hash"),
  favoritePlayer: text("favorite_player"),
  status: text("status", { enum: ["active", "suspended", "expired"] }).notNull().default("active"),
  notificationPref: text("notification_pref", { enum: ["whatsapp", "sms", "email"] }).notNull().default("whatsapp"),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

