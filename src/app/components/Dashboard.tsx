import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

const colorMap = {
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-green-600',
};

export function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([
    {
      id: 1,
      title: 'Total Products',
      value: '0',
      change: 'Live',
      trend: 'up' as const,
      icon: Package,
      color: 'blue',
    },
    {
      id: 2,
      title: 'Low Stock Items',
      value: '0',
      change: 'Action Needed',
      trend: 'down' as const,
      icon: AlertTriangle,
      color: 'orange',
    },
    {
      id: 3,
      title: "Today's Logins",
      value: '0',
      change: 'Live Activity',
      trend: 'up' as const,
      icon: Clock,
      color: 'purple',
    },
    {
      id: 4,
      title: 'Inventory Value',
      value: '$0',
      change: 'Estimated',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'green',
    },
  ]);

  const [stockData, setStockData] = useState<{ name: string; quantity: number }[]>([]);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);

  useEffect(() => {
    // === INVENTORY DATA ===
    const inventoryRef = ref(database, 'Inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.values(data) as any[];

        // 1. Metrics Calculation
        const totalProducts = items.length;
        const lowStockCount = items.filter((i: any) => Number(i.Quantity || 0) <= Number(i.Threshold || 5)).length;
        const totalValue = items.reduce((sum: number, i: any) => sum + (Number(i.Quantity || 0) * Number(i['Unit Price'] || 0)), 0);

        // 2. Chart Data (Current Stock Levels)
        const chartData = items.map((i: any) => ({
          name: i.Name,
          quantity: Number(i.Quantity || 0)
        })).slice(0, 10); // Limit to top 10 for readability

        setStockData(chartData);

        setMetrics(prev => prev.map(m => {
          if (m.title === 'Total Products') return { ...m, value: totalProducts.toString() };
          if (m.title === 'Low Stock Items') return { ...m, value: lowStockCount.toString(), trend: lowStockCount > 0 ? 'down' : 'up' };
          if (m.title === 'Inventory Value') return { ...m, value: `₱${totalValue.toLocaleString()}` };
          return m;
        }));
      }
    });

    // === ATTENDANCE DATA ===
    const attendanceRef = ref(database, 'Attendance');
    const unsubscribeAttendance = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Flatten Data
        const logins: any[] = [];
        const todayStr = new Date().toISOString().split('T')[0];

        Object.entries(data).forEach(([dateKey, users]) => {
          if (typeof users === 'object' && users !== null) {
            Object.entries(users).forEach(([userKey, record]: [string, any]) => {
              logins.push({
                id: `${dateKey}_${userKey}`,
                user: record.Name || userKey,
                date: dateKey,
                time: record.Time_in || '--:--',
                status: 'Success'
              });
            });
          }
        });

        // Sort by Date/Time Descending
        logins.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        const todayCount = logins.filter(l => l.date === todayStr).length;

        setRecentLogins(logins.slice(0, 5)); // Top 5 recent

        setMetrics(prev => prev.map(m => {
          if (m.title === "Today's Logins") return { ...m, value: todayCount.toString() };
          return m;
        }));
      }
    });

    return () => {
      unsubscribeInventory();
      unsubscribeAttendance();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights from your stock and attendance
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={metric.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 
                       hover:shadow-lg transition-shadow duration-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 relative z-10">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon
                      className={`w-4 h-4 ${metric.trend === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}
                    />
                    <span
                      className={`text-sm font-medium ${metric.trend === 'up'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}
                    >
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMap[metric.color as keyof typeof colorMap]} 
                              flex items-center justify-center relative z-10 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Stock Levels
            </h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Inventory
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" vertical={false} />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey="quantity"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Login Activity
            </h2>
            <button
              onClick={() => navigate('/login-history')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentLogins.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity found.</p>
            ) : (
              recentLogins.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 
                                                dark:border-gray-800 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                                flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {activity.user.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user}</span> logged in
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {activity.date} at {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Logins Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Attendance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentLogins.map((login) => (
                <tr key={login.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {login.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {login.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {login.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
