import {
   users,
   favorites,
   userPreferences,
   contactMessages,
   subscriptions,
   payments,
   banners,
   collections,
   content,
   notifications,
   userSessions,
   viewTracking,
   episodes,
   comments,
   type User,
   type InsertUser,
   type Favorite,
   type InsertFavorite,
   type UserPreferences,
   type InsertUserPreferences,
   type ContactMessage,
   type InsertContactMessage,
   type Subscription,
   type InsertSubscription,
   type Payment,
   type InsertPayment,
   type Banner,
   type InsertBanner,
   type Collection,
   type InsertCollection,
   type Content,
   type InsertContent,
   type Notification,
   type InsertNotification,
   type UserSession,
   type InsertUserSession,
   type ViewTracking,
   type InsertViewTracking,
   type Comment,
   type InsertComment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  banUser(userId: string): Promise<User>;
  unbanUser(userId: string): Promise<User>;
  
  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>;
  getAllFavorites(): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, movieId: number): Promise<void>;
  isFavorite(userId: string, movieId: number): Promise<boolean>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  deleteContactMessage(messageId: string): Promise<void>;
  
  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(): Promise<Subscription[]>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  updateSubscription(subscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(): Promise<Payment[]>;
  getUserPayments(userId: string): Promise<Payment[]>;
  
  // Banners
  createBanner(banner: InsertBanner): Promise<Banner>;
  getBanners(): Promise<Banner[]>;
  updateBanner(bannerId: string, data: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(bannerId: string): Promise<void>;
  
  // Collections
  createCollection(collection: InsertCollection): Promise<Collection>;
  getCollections(): Promise<Collection[]>;
  updateCollection(collectionId: string, data: Partial<InsertCollection>): Promise<Collection>;
  deleteCollection(collectionId: string): Promise<void>;
  
  // Content Management
  createContent(content: InsertContent): Promise<Content>;
  getContent(): Promise<Content[]>;
  getAllContent(): Promise<Content[]>;
  getContentById(contentId: string): Promise<Content | undefined>;
  updateContent(contentId: string, data: Partial<InsertContent>): Promise<Content>;
  deleteContent(contentId: string): Promise<void>;
  getContentByTmdbId(tmdbId: number): Promise<Content | undefined>;
  
  // Episode Management
  createEpisode(episode: any): Promise<any>;
  getEpisodesByContentId(contentId: string): Promise<any[]>;
  getEpisodeById(episodeId: string): Promise<any | undefined>;
  updateEpisode(episodeId: string, data: Partial<any>): Promise<any>;
  deleteEpisode(episodeId: string): Promise<void>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getNotificationById(notificationId: string): Promise<Notification | undefined>;
  getAllNotifications(): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  deleteNotification(notificationId: string): Promise<void>;
  sendNotificationToUser(userId: string, title: string, message: string, type?: string): Promise<Notification>;
  sendAnnouncementToAllUsers(title: string, message: string): Promise<Notification[]>;
  
  // User Management
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<User>;
  updateUserSubscriptionPlan(userId: string, planId: string): Promise<void>;
  
  // User Sessions
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getActiveSessions(): Promise<UserSession[]>;
  endUserSession(sessionId: string): Promise<void>;
  
  // View Tracking
  createViewTracking(view: InsertViewTracking): Promise<ViewTracking>;
  getViewStats(): Promise<{dailyViews: number, weeklyViews: number}>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByContentId(contentId: string): Promise<Comment[]>;
  getCommentById(commentId: string): Promise<Comment | undefined>;
  updateComment(commentId: string, data: Partial<InsertComment>): Promise<Comment>;
  updateCommentApproval(commentId: string, approved: boolean): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  getAllComments(): Promise<Comment[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getAllNotifications(): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  deleteNotification(notificationId: string): Promise<void>;
  sendNotificationToUser(userId: string, title: string, message: string, type?: string): Promise<Notification>;
  sendAnnouncementToAllUsers(title: string, message: string): Promise<Notification[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    // Validate input to prevent injection
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Validate input to prevent injection
    if (!username || typeof username !== 'string') {
      throw new Error('Invalid username');
    }
    
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Validate input to prevent injection
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email');
    }
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Validate input
    if (!insertUser.username || !insertUser.email || !insertUser.password) {
      throw new Error('Missing required user fields');
    }
    
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async banUser(userId: string): Promise<User> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    const [user] = await db
      .update(users)
      .set({ banned: true } as Partial<User>)
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async unbanUser(userId: string): Promise<User> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    const [user] = await db
      .update(users)
      .set({ banned: false } as Partial<User>)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    const [user] = await db
      .update(users)
      .set(updates as any)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }


  // Favorites
  async getFavorites(userId: string): Promise<Favorite[]> {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.addedAt));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    // Validate input
    if (!favorite.userId || !favorite.movieId) {
      throw new Error('Missing required favorite fields');
    }
    
    const [newFavorite] = await db.insert(favorites).values(favorite as any).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, movieId: number): Promise<void> {
    // Validate input
    if (!userId || typeof userId !== 'string' || !movieId || typeof movieId !== 'number') {
      throw new Error('Invalid user ID or movie ID');
    }
    
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
  }

  async isFavorite(userId: string, movieId: number): Promise<boolean> {
    // Validate input
    if (!userId || typeof userId !== 'string' || !movieId || typeof movieId !== 'number') {
      throw new Error('Invalid user ID or movie ID');
    }
    
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
    return !!favorite;
  }

  async getAllFavorites(): Promise<Favorite[]> {
    return await db.select().from(favorites).orderBy(desc(favorites.addedAt));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      const [updated] = await db
        .update(userPreferences)
        .set(preferences as any)
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values({ userId, ...preferences } as any)
        .returning();
      return created;
    }
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async deleteContactMessage(messageId: string): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));
  }

  // Subscriptions
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription as any).returning();
    return newSubscription;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async updateSubscription(subscriptionId: string, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set(data as any)
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    return updated;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status: 'cancelled' } as Partial<Subscription>)
      .where(eq(subscriptions.id, subscriptionId));
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment as any).returning();
    return newPayment;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  // Banners
  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values(banner as any).returning();
    return newBanner;
  }

  async getBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(desc(banners.createdAt));
  }

  async updateBanner(bannerId: string, data: Partial<InsertBanner>): Promise<Banner> {
    const [updated] = await db
      .update(banners)
      .set(data as any)
      .where(eq(banners.id, bannerId))
      .returning();
    return updated;
  }

  async deleteBanner(bannerId: string): Promise<void> {
    await db.delete(banners).where(eq(banners.id, bannerId));
  }

  // Collections
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection as any).returning();
    return newCollection;
  }

  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async updateCollection(collectionId: string, data: Partial<InsertCollection>): Promise<Collection> {
    const [updated] = await db
      .update(collections)
      .set(data as any)
      .where(eq(collections.id, collectionId))
      .returning();
    return updated;
  }

  async deleteCollection(collectionId: string): Promise<void> {
    await db.delete(collections).where(eq(collections.id, collectionId));
  }

  // Content Management
  async createContent(content: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(content as any).returning();
    return newContent;
  }

  async getContent(): Promise<Content[]> {
    return await db.select().from(content).orderBy(desc(content.createdAt));
  }

  async getAllContent(): Promise<Content[]> {
    return await db.select().from(content).orderBy(desc(content.createdAt));
  }

  async getContentById(contentId: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, contentId));
    return item || undefined;
  }

  async updateContent(contentId: string, data: Partial<InsertContent>): Promise<Content> {
    const [updated] = await db
      .update(content)
      .set(data as any)
      .where(eq(content.id, contentId))
      .returning();
    return updated;
  }

  async deleteContent(contentId: string): Promise<void> {
    await db.delete(content).where(eq(content.id, contentId));
  }

  async getContentByTmdbId(tmdbId: number): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.tmdbId, tmdbId));
    return item || undefined;
  }

  // Episode Management
  async createEpisode(episode: any): Promise<any> {
    const [newEpisode] = await db.insert(episodes).values(episode).returning();
    return newEpisode;
  }

  async getEpisodesByContentId(contentId: string): Promise<any[]> {
    return await db
      .select()
      .from(episodes)
      .where(eq(episodes.contentId, contentId))
      .orderBy(episodes.seasonNumber, episodes.episodeNumber);
  }

  async getEpisodeById(episodeId: string): Promise<any | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
    return episode || undefined;
  }

  async updateEpisode(episodeId: string, data: Partial<any>): Promise<any> {
    const [updated] = await db
      .update(episodes)
      .set(data)
      .where(eq(episodes.id, episodeId))
      .returning();
    return updated;
  }

  async deleteEpisode(episodeId: string): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, episodeId));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotificationById(notificationId: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, notificationId));
    return notification || undefined;
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true } as Partial<Notification>)
      .where(eq(notifications.id, notificationId));
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true } as Partial<Notification>)
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async sendNotificationToUser(userId: string, title: string, message: string, type?: string): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type: type || 'info'
      } as InsertNotification)
      .returning();
    return notification;
  }

  async sendAnnouncementToAllUsers(title: string, message: string): Promise<Notification[]> {
    // Get all users
    const users = await this.getAllUsers();
    
    // Create notifications for each user
    const notifications = users.map(user => ({
      userId: user.id,
      title,
      message,
      type: 'announcement'
    }));
    
    // Insert all notifications
    const results = await db.insert(notifications).values(notifications).returning();
    return results;
  }

  // User Sessions
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getActiveSessions(): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(sql`${userSessions.expiresAt} > NOW()`)
      .orderBy(desc(userSessions.createdAt));
  }

  async endUserSession(sessionId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ expiresAt: new Date() } as Partial<UserSession>)
      .where(eq(userSessions.id, sessionId));
  }

  // View Tracking
  async createViewTracking(view: InsertViewTracking): Promise<ViewTracking> {
    const [newView] = await db.insert(viewTracking).values(view).returning();
    return newView;
  }

  async getViewStats(): Promise<{dailyViews: number, weeklyViews: number}> {
    // Get daily views (last 24 hours)
    const dailyViewsResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(viewTracking)
      .where(sql`${viewTracking.viewedAt} > NOW() - INTERVAL '1 day'`);
    
    const dailyViews = Number(dailyViewsResult[0]?.count || 0);
    
    // Get weekly views (last 7 days)
    const weeklyViewsResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(viewTracking)
      .where(sql`${viewTracking.viewedAt} > NOW() - INTERVAL '7 days'`);
    
    const weeklyViews = Number(weeklyViewsResult[0]?.count || 0);
    
    return { dailyViews, weeklyViews };
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsByContentId(contentId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.contentId, contentId))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentById(commentId: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
    return comment || undefined;
  }

  async updateComment(commentId: string, data: Partial<InsertComment>): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set(data)
      .where(eq(comments.id, commentId))
      .returning();
    return updated;
  }

  async updateCommentApproval(commentId: string, approved: boolean): Promise<Comment> {
    const [updated] = await db
      .update(comments)
      .set({ approved } as Partial<Comment>)
      .where(eq(comments.id, commentId))
      .returning();
    return updated;
  }

  async deleteComment(commentId: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, commentId));
  }

  async getAllComments(): Promise<Comment[]> {
    return await db.select().from(comments).orderBy(desc(comments.createdAt));
  }
}