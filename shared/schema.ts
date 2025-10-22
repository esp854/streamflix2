import { pgTable, varchar, integer, boolean, timestamp, text, jsonb, serial, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm'; // Ajout de l'import manquant

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  role: varchar("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(), // Added banned field
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  movieId: integer("movie_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Watch progress tracking for "Continue Watching" feature

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  language: varchar("language").default("fr"),
  theme: varchar("theme").default("dark"),
  notifications: boolean("notifications").default(true),
  autoplay: boolean("autoplay").default(true),
  quality: varchar("quality").default("auto"),
});

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  status: varchar("status").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  status: varchar("status").notNull(),
  transactionId: varchar("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Banners table
export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url"),
  linkUrl: varchar("link_url"),
  priority: integer("priority").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  type: text("type"), // Added type field
  category: text("category"), // Added category field
  price: text("price"), // Added price field
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Collections table
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  category: varchar("category").notNull(),
  imageUrl: varchar("image_url"),
  priority: integer("priority").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Content table (movies/series)
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tmdbId: integer("tmdb_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  releaseDate: text("release_date"),
  genres: jsonb("genres"),
  odyseeUrl: text("odysee_url"),
  muxPlaybackId: text("mux_playback_id"),
  muxUrl: text("mux_url"),
  language: varchar("language").notNull(),
  quality: varchar("quality").notNull(),
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  rating: integer("rating"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Episodes table (for TV series)
export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  seasonNumber: integer("season_number").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  odyseeUrl: text("odysee_url"),
  muxPlaybackId: text("mux_playback_id"),
  muxUrl: text("mux_url"),
  duration: integer("duration"),
  releaseDate: text("release_date"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").default("info"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sessions table
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  isActive: boolean("is_active").default(true).notNull(),
  sessionStart: timestamp("session_start").defaultNow().notNull(),
  sessionEnd: timestamp("session_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// View tracking table
export const viewTracking = pgTable("view_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").references(() => content.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").references(() => userSessions.id, { onDelete: "cascade" }),
  movieId: integer("movie_id"),
  viewDuration: integer("view_duration"), // in seconds
  viewDate: timestamp("view_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments table for user comments on content
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  rating: integer("rating"), // Optional rating 1-5 stars
  approved: boolean("approved").default(true).notNull(), // For moderation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  preferences: many(userPreferences),
  subscriptions: many(subscriptions),
  payments: many(payments),
  notifications: many(notifications),
  sessions: many(userSessions),
  views: many(viewTracking),
  comments: many(comments),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  views: many(viewTracking),
}));

export const viewTrackingRelations = relations(viewTracking, ({ one }) => ({
  user: one(users, {
    fields: [viewTracking.userId],
    references: [users.id],
  }),
  session: one(userSessions, {
    fields: [viewTracking.sessionId],
    references: [userSessions.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  content: one(content, {
    fields: [comments.contentId],
    references: [content.id],
  }),
}));

// Episodes relations
export const episodesRelations = relations(episodes, ({ one }) => ({
  content: one(content, {
    fields: [episodes.contentId],
    references: [content.id],
  }),
}));

export const contentRelations = relations(content, ({ many }) => ({
  episodes: many(episodes),
  comments: many(comments),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  addedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertViewTrackingSchema = createInsertSchema(viewTracking).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});
