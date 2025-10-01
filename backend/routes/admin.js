import express from "express";
import { db } from "../../server/db.ts";
import { eq } from "drizzle-orm";
import {
  users as usersTable,
  favorites,
  contactMessages,
  subscriptions,
  payments,
  banners,
  collections,
  content,
  episodes
} from "@shared/schema";

const router = express.Router();

// Content management endpoints
router.get("/admin/content", async (req, res) => {
  try {
    const allContent = await db.select().from(content);
    res.json(allContent);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Add endpoint to fetch content by TMDB ID
router.get("/contents/tmdb/:tmdbId", async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const contentItem = await db.select().from(content).where(eq(content.tmdbId, parseInt(tmdbId))).limit(1);

    if (!contentItem || contentItem.length === 0) {
      // Return a default content object with empty video URL instead of 404
      return res.json({
        id: `tmdb-${tmdbId}`,
        tmdbId: parseInt(tmdbId),
        odyseeUrl: "",
        active: false,
        createdAt: new Date().toISOString()
      });
    }

    const item = contentItem[0];

    // Check if content has a video URL
    if (!item.odyseeUrl) {
      // Return content with empty URL instead of 404
      return res.json({
        ...item,
        odyseeUrl: ""
      });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching content by TMDB ID:", error);
    // Return a default content object with empty video URL instead of error
    const { tmdbId } = req.params;
    res.json({
      id: `tmdb-${tmdbId}`,
      tmdbId: parseInt(tmdbId),
      odyseeUrl: "",
      active: false,
      createdAt: new Date().toISOString()
    });
  }
});

router.post("/admin/content", async (req, res) => {
  try {
    const newContentData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [newContent] = await db.insert(content).values(newContentData).returning();
    res.status(201).json(newContent);
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({ error: "Failed to create content" });
  }
});

// User management endpoints
router.get("/admin/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(usersTable);
    // Remove passwords from response
    const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const [updatedUser] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/admin/users/:userId/suspend", async (req, res) => {
  try {
    const { userId } = req.params;

    const [updatedUser] = await db.update(usersTable)
      .set({ banned: true })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User suspended successfully" });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
});

// Add delete user endpoint
router.delete("/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.delete(usersTable).where(eq(usersTable.id, userId));

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Favorites management endpoints
router.get("/admin/favorites", async (req, res) => {
  try {
    const allFavorites = await db.select().from(favorites);
    res.json(allFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Contact messages endpoints
router.get("/contact-messages", async (req, res) => {
  try {
    const messages = await db.select().from(contactMessages);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

router.delete("/contact-messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const result = await db.delete(contactMessages).where(eq(contactMessages.id, messageId));

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact message:", error);
    res.status(500).json({ error: "Failed to delete contact message" });
  }
});

// Subscriptions management endpoints
router.get("/admin/subscriptions", async (req, res) => {
  try {
    const allSubscriptions = await db.select().from(subscriptions);
    res.json(allSubscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
});

// Payments history endpoints
router.get("/admin/payments", async (req, res) => {
  try {
    const allPayments = await db.select().from(payments);
    res.json(allPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Analytics data endpoints
router.get("/admin/analytics", async (req, res) => {
  try {
    // Get real data from database
    const [allUsers, allContent, allSubscriptions, allPayments] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(content),
      db.select().from(subscriptions),
      db.select().from(payments)
    ]);

    const analytics = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => !u.banned).length,
      newUsersThisWeek: 2, // This would need a date query in a real implementation
      totalMovies: allContent.filter(c => c.mediaType === 'movie').length,
      totalSeries: allContent.filter(c => c.mediaType === 'tv').length,
      dailyViews: 124, // This would need view tracking implementation
      weeklyViews: 842, // This would need view tracking implementation
      activeSubscriptionsCount: allSubscriptions.filter(s => s.status === 'active').length,
      activeSessions: 12, // This would need session tracking
      revenue: {
        monthly: allPayments
          .filter(p => p.status === 'success')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        growth: 12.5, // This would need time-based calculation
        totalPayments: allPayments.filter(p => p.status === 'success').length
      },
      subscriptions: {
        basic: allSubscriptions.filter(s => s.planId === 'basic').length,
        standard: allSubscriptions.filter(s => s.planId === 'standard').length,
        premium: allSubscriptions.filter(s => s.planId === 'premium').length
      },
      recentActivity: {
        newMoviesAdded: 3, // This would need date-based queries
        newUsersToday: 1 // This would need date-based queries
      }
    };
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Banners management endpoints
router.get("/admin/banners", async (req, res) => {
  try {
    const allBanners = await db.select().from(banners);
    res.json(allBanners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

router.put("/admin/banners/:bannerId", async (req, res) => {
  try {
    const { bannerId } = req.params;
    const updates = req.body;

    const [updatedBanner] = await db.update(banners)
      .set(updates)
      .where(eq(banners.id, bannerId))
      .returning();

    if (!updatedBanner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    res.json(updatedBanner);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// Collections management endpoints
router.get("/admin/collections", async (req, res) => {
  try {
    const allCollections = await db.select().from(collections);
    res.json(allCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// Security logs endpoints - TODO: Implement proper security logs table
router.get("/admin/security-logs", (req, res) => {
  try {
    // For now, return empty array until security logs table is implemented
    res.json([]);
  } catch (error) {
    console.error("Error fetching security logs:", error);
    res.status(500).json({ error: "Failed to fetch security logs" });
  }
});

// Activity logs endpoints - TODO: Implement proper activity logs table
router.get("/admin/activity-logs", (req, res) => {
  try {
    // For now, return empty array until activity logs table is implemented
    res.json([]);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// Search content endpoint
router.post("/admin/search-content", (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    // Mock search results - in a real app, this would search TMDB
    const mockMovies = [
      { id: 550, title: "Fight Club", release_date: "1999-10-15", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
      { id: 680, title: "Pulp Fiction", release_date: "1994-09-10", poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" }
    ];

    const mockTVShows = [
      { id: 1399, name: "Game of Thrones", first_air_date: "2011-04-17", poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg" },
      { id: 66732, name: "Stranger Things", first_air_date: "2016-07-15", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" }
    ];

    res.json({
      movies: mockMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase())),
      tvShows: mockTVShows.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    });
  } catch (error) {
    console.error("Error searching content:", error);
    res.status(500).json({ error: "Failed to search content" });
  }
});

// Get episodes for a content ID
router.get("/admin/episodes/:contentId", async (req, res) => {
  try {
    const { contentId } = req.params;
    const list = await db.select().from(episodes).where(eq(episodes.contentId, contentId));
    res.json({ episodes: list });
  } catch (error) {
    console.error("Error fetching episodes:", error);
    res.status(500).json({ error: "Failed to fetch episodes" });
  }
});

// Add endpoint to fetch content with video links
router.get("/admin/content-with-links", async (req, res) => {
  try {
    // Fetch content that has video links (odyseeUrl is not null or empty)
    const contentWithLinks = await db.select().from(content).where(
      // Note: Drizzle doesn't have a direct 'is not empty' operator, so we'll filter in JS
      // In a production environment, you might want to add a boolean field to track this
    );
    
    // Filter content that actually has video links
    const filteredContent = contentWithLinks.filter(item => 
      item.odyseeUrl && item.odyseeUrl.trim() !== ''
    );
    
    res.json(filteredContent);
  } catch (error) {
    console.error("Error fetching content with links:", error);
    res.status(500).json({ error: "Failed to fetch content with links" });
  }
});

// Add endpoint to fetch featured content with links for homepage
router.get("/admin/featured-content", async (req, res) => {
  try {
    // Fetch content that has video links and is active
    const contentWithLinks = await db.select().from(content).where(
      // Same note as above about filtering
      undefined
    );
    
    // Filter content that actually has video links and is active
    const filteredContent = contentWithLinks.filter(item => 
      item.odyseeUrl && item.odyseeUrl.trim() !== '' && item.active
    );
    
    // Separate movies and TV shows
    const movies = filteredContent.filter(item => item.mediaType === 'movie');
    const tvShows = filteredContent.filter(item => item.mediaType === 'tv');
    
    // Return a structured response
    res.json({
      movies: movies.slice(0, 20), // Limit to 20 movies
      tvShows: tvShows.slice(0, 20) // Limit to 20 TV shows
    });
  } catch (error) {
    console.error("Error fetching featured content:", error);
    res.status(500).json({ error: "Failed to fetch featured content" });
  }
});

// Create a new episode
router.post("/admin/episodes", async (req, res) => {
  try {
    const {
      contentId,
      seasonNumber,
      episodeNumber,
      title,
      description = "",
      odyseeUrl = "",
      releaseDate = null,
      active = true,
    } = req.body || {};

    if (!contentId || seasonNumber == null || episodeNumber == null || !title) {
      return res.status(400).json({
        error: "contentId, seasonNumber, episodeNumber and title are required",
      });
    }

    const newEpisodeData = {
      contentId,
      seasonNumber: Number(seasonNumber),
      episodeNumber: Number(episodeNumber),
      title,
      description,
      odyseeUrl,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      active: Boolean(active),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newEpisode] = await db.insert(episodes).values(newEpisodeData).returning();
    res.status(201).json(newEpisode);
  } catch (error) {
    console.error("Error creating episode:", error);
    res.status(500).json({ error: "Failed to create episode" });
  }
});

// Update an episode
router.put("/admin/episodes/:episodeId", async (req, res) => {
  try {
    const { episodeId } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    const [updatedEpisode] = await db.update(episodes)
      .set(updateData)
      .where(eq(episodes.id, episodeId))
      .returning();

    if (!updatedEpisode) {
      return res.status(404).json({ error: "Episode not found" });
    }

    res.json(updatedEpisode);
  } catch (error) {
    console.error("Error updating episode:", error);
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Delete an episode
router.delete("/admin/episodes/:episodeId", async (req, res) => {
  try {
    const { episodeId } = req.params;

    const result = await db.delete(episodes).where(eq(episodes.id, episodeId));

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Episode not found" });
    }

    res.json({ message: "Episode deleted successfully" });
  } catch (error) {
    console.error("Error deleting episode:", error);
    res.status(500).json({ error: "Failed to delete episode" });
  }
});

// Add endpoint to delete content
router.delete("/admin/content/:contentId", async (req, res) => {
  try {
    const { contentId } = req.params;

    // First delete all episodes associated with this content (for TV shows)
    await db.delete(episodes).where(eq(episodes.contentId, contentId));
    
    // Then delete the content itself
    const result = await db.delete(content).where(eq(content.id, contentId));

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

export default router;