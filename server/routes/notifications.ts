import express from "express";
import { storage } from "../server/storage.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const sendNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["info", "warning", "success", "error", "announcement"]).optional().default("info")
});

const sendAnnouncementSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required")
});

// Get user notifications
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const userNotifications = await storage.getUserNotifications(userId);
    res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get all notifications (admin only)
router.get("/notifications", async (req, res) => {
  try {
    // In a real app, you would check if the user is admin
    // For now, we'll allow it for testing
    const allNotifications = await storage.getAllNotifications();
    res.json(allNotifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Send a notification to a specific user
router.post("/notifications/send", async (req, res) => {
  try {
    const validatedData = sendNotificationSchema.parse(req.body);
    const { userId, title, message, type } = validatedData;
    
    const notification = await storage.sendNotificationToUser(userId, title, message, type);
    
    // Emit real-time notification via Socket.IO
    // This will be handled by the main server
    
    res.status(201).json({ 
      success: true, 
      message: "Notification sent successfully",
      notification 
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to send notification" });
    }
  }
});

// Send announcement to all users
router.post("/send-announcement", async (req, res) => {
  try {
    const validatedData = sendAnnouncementSchema.parse(req.body);
    const { subject, message } = validatedData;
    
    const notifications = await storage.sendAnnouncementToAllUsers(subject, message);
    
    // Emit real-time announcement via Socket.IO
    // This will be handled by the main server
    
    res.status(201).json({ 
      success: true, 
      message: "Announcement sent to all users successfully",
      notificationsCount: notifications.length
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid data", details: error.errors });
    } else {
      res.status(500).json({ error: "Failed to send announcement" });
    }
  }
});

// Mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Notification ID is required" });
    }
    
    const notification = await storage.markNotificationAsRead(id);
    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Delete a notification
router.delete("/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Notification ID is required" });
    }
    
    await storage.deleteNotification(id);
    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Mark all notifications as read for a user
router.put("/notifications/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Get all unread notifications for the user
    const userNotifications = await storage.getUserNotifications(userId);
    const unreadNotifications = userNotifications.filter(n => !n.read);
    
    // Mark all as read
    const updatePromises = unreadNotifications.map(notification => 
      storage.markNotificationAsRead(notification.id)
    );
    
    await Promise.all(updatePromises);
    
    res.json({ 
      success: true, 
      message: `Marked ${unreadNotifications.length} notifications as read` 
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Get notification count for a user
router.get("/notifications/:userId/count", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const userNotifications = await storage.getUserNotifications(userId);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({ 
      total: userNotifications.length,
      unread: unreadCount,
      read: userNotifications.length - unreadCount
    });
  } catch (error) {
    console.error("Error getting notification count:", error);
    res.status(500).json({ error: "Failed to get notification count" });
  }
});

export default router;
