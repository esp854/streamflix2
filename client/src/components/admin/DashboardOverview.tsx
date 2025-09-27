import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Film, CreditCard, DollarSign, TrendingUp, Activity, Eye, Video, AlertTriangle, Shield } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardOverviewProps {
  totalUsersCount: number;
  totalMoviesCount: number;
  totalSeriesCount: number;
  activeSubscriptionsCount: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeUsersCount: number;
  dailyViewsCount: number;
  subsBasic: number;
  subsStandard: number;
  subsPremium: number;
  userGrowthData: any[];
  revenueData: any[];
  subscriptionData: any[];
  contentTypeData: any[];
  analytics: any;
  securityLogs: any[];
  usersLoading: boolean;
  contentLoading: boolean;
  subscriptionsLoading: boolean;
  analyticsLoading: boolean;
  securityLogsLoading: boolean;
}

export default function DashboardOverview({
  totalUsersCount,
  totalMoviesCount,
  totalSeriesCount,
  activeSubscriptionsCount,
  monthlyRevenue,
  revenueGrowth,
  activeUsersCount,
  dailyViewsCount,
  subsBasic,
  subsStandard,
  subsPremium,
  userGrowthData,
  revenueData,
  subscriptionData,
  contentTypeData,
  analytics,
  securityLogs,
  usersLoading,
  contentLoading,
  subscriptionsLoading,
  analyticsLoading,
  securityLogsLoading,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tableau de Bord</h2>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Utilisateurs</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {totalUsersCount}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {analytics ? `+${analytics.newUsersThisWeek || 0} cette semaine` : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Contenus</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Film className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                    {totalMoviesCount + totalSeriesCount}
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {totalMoviesCount} films, {totalSeriesCount} séries
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Abonnements</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                    {activeSubscriptionsCount}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Abonnements actifs
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Revenus</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                    {`${monthlyRevenue.toLocaleString()} FCFA`}
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
                    {revenueGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                    {`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% ce mois`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mini Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Croissance Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowthData.slice(-3)}>
                  <defs>
                    <linearGradient id="miniUserGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#miniUserGrowth)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscription Distribution Mini Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Abonnements Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {subscriptionData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityLogsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : securityLogs && securityLogs.slice(0, 5).map((log: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    log.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {log.eventType === 'ADMIN_ACCESS' ? <Users className="h-4 w-4" /> :
                     log.eventType === 'FAILED_LOGIN' ? <Activity className="h-4 w-4" /> :
                     log.eventType === 'BRUTE_FORCE_ATTEMPT' ? <AlertTriangle className="h-4 w-4" /> :
                     <Shield className="h-4 w-4" />}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {log.eventType === 'ADMIN_ACCESS' ? 'Accès administrateur' :
                       log.eventType === 'FAILED_LOGIN' ? 'Échec de connexion' :
                       log.eventType === 'BRUTE_FORCE_ATTEMPT' ? 'Tentative de force brute' :
                       log.eventType}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}