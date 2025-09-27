import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, Content, Subscription, Payment } from "@shared/schema";
import { tmdbService } from "@/lib/tmdb";

interface Episode {
  id: string;
  contentId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  odyseeUrl?: string;
  releaseDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecurityEvent {
  timestamp: Date | string;
  eventType: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: string;
  severity: string;
  description: string;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalMovies: number;
  totalSeries: number;
  dailyViews: number;
  weeklyViews: number;
  activeSubscriptionsCount: number;
  activeSessions: number;
  revenue: {
    monthly: number;
    growth: number;
    totalPayments: number;
  };
  subscriptions: {
    basic: number;
    standard: number;
    premium: number;
  };
  recentActivity: {
    newMoviesAdded: number;
    newUsersToday: number;
  };
}

export function useAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch users data
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/users", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      return response.json();
    },
  });

  // Fetch content data
  const { data: existingContent, isLoading: contentLoading, error: contentError } = useQuery({
    queryKey: ["/api/admin/content"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/content", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch content");

      return response.json();
    },
  });

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/analytics", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");

      return response.json();
    },
  });

  // Fetch security logs data
  const { data: securityLogs, isLoading: securityLogsLoading, error: securityLogsError } = useQuery({
    queryKey: ["/api/admin/security-logs"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/security-logs", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch security logs");

      return response.json();
    },
  });

  // Fetch activity logs data
  const { data: activityLogs, isLoading: activityLoading, error: activityLogsError } = useQuery({
    queryKey: ["/api/admin/activity-logs"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/activity-logs", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch activity logs");

      return response.json();
    },
  });

  // Fetch subscriptions data
  const { data: subscriptions, isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/subscriptions", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch subscriptions");

      return response.json();
    },
  });

  // Derived metrics for dashboard
  const totalUsersCount = (analytics as any)?.totalUsers ?? (users ? users.length : 0);
  const totalMoviesCount = (analytics as any)?.totalMovies ?? (existingContent ? existingContent.filter((c: Content) => c.mediaType === 'movie').length : 0);
  const totalSeriesCount = (analytics as any)?.totalSeries ?? (existingContent ? existingContent.filter((c: Content) => c.mediaType === 'tv').length : 0);
  const activeSubscriptionsCount = (analytics as any)?.activeSubscriptionsCount ?? (subscriptions ? subscriptions.filter((s: Subscription) => (s as any).status === 'active').length : 0);
  const monthlyRevenue = (analytics as any)?.revenue?.monthly ?? (subscriptions ? subscriptions.filter((s: Subscription) => (s as any).status === 'active').reduce((sum: number, s: Subscription) => sum + ((s as any).amount || 0), 0) : 0);
  const revenueGrowth = (analytics as any)?.revenue?.growth ?? 0;
  const activeUsersCount = (analytics as any)?.activeUsers ?? (users ? users.length : 0);
  const dailyViewsCount = (analytics as any)?.dailyViews ?? (analytics as any)?.viewStats?.daily ?? 0;
  const weeklyViewsCount = (analytics as any)?.weeklyViews ?? (analytics as any)?.viewStats?.weekly ?? 0;
  const subsBasic = subscriptions ? subscriptions.filter((s: Subscription) => (s as any).planId === 'basic').length : ((analytics as any)?.subscriptions?.basic ?? 0);
  const subsStandard = subscriptions ? subscriptions.filter((s: Subscription) => (s as any).planId === 'standard').length : ((analytics as any)?.subscriptions?.standard ?? 0);
  const subsPremium = subscriptions ? subscriptions.filter((s: Subscription) => (s as any).planId === 'premium').length : ((analytics as any)?.subscriptions?.premium ?? 0);

  // Sample data for charts
  const userGrowthData = [
    { month: 'Jan', users: 120, newUsers: 12 },
    { month: 'Fév', users: 145, newUsers: 25 },
    { month: 'Mar', users: 168, newUsers: 23 },
    { month: 'Avr', users: 192, newUsers: 24 },
    { month: 'Mai', users: 218, newUsers: 26 },
    { month: 'Jun', users: totalUsersCount, newUsers: totalUsersCount - 218 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 1200, target: 1500 },
    { month: 'Fév', revenue: 1800, target: 1500 },
    { month: 'Mar', revenue: 1600, target: 1500 },
    { month: 'Avr', revenue: 2200, target: 1500 },
    { month: 'Mai', revenue: 1900, target: 1500 },
    { month: 'Jun', revenue: monthlyRevenue, target: 2000 }
  ];

  const subscriptionData = [
    { name: 'Basique', value: subsBasic, color: '#3b82f6' },
    { name: 'Standard', value: subsStandard, color: '#10b981' },
    { name: 'Premium', value: subsPremium, color: '#8b5cf6' }
  ];

  const contentTypeData = [
    { name: 'Films', value: totalMoviesCount, color: '#f59e0b' },
    { name: 'Séries', value: totalSeriesCount, color: '#ef4444' }
  ];

  return {
    // Data
    users,
    existingContent,
    analytics,
    securityLogs,
    activityLogs,
    subscriptions,

    // Loading states
    usersLoading,
    contentLoading,
    analyticsLoading,
    securityLogsLoading,
    activityLoading,
    subscriptionsLoading,

    // Errors
    usersError,
    contentError,
    analyticsError,
    securityLogsError,
    activityLogsError,
    subscriptionsError,

    // Derived metrics
    totalUsersCount,
    totalMoviesCount,
    totalSeriesCount,
    activeSubscriptionsCount,
    monthlyRevenue,
    revenueGrowth,
    activeUsersCount,
    dailyViewsCount,
    weeklyViewsCount,
    subsBasic,
    subsStandard,
    subsPremium,

    // Chart data
    userGrowthData,
    revenueData,
    subscriptionData,
    contentTypeData,

    // Query client for mutations
    queryClient,
    toast,
  };
}