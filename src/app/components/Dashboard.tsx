import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';

// Mock data fallbacks (used if DB is empty or loading)
const defaultMetrics = [
  {
    id: 1,
    title: 'Total Products',
    value: '0',
    change: '0%',
    trend: 'up' as const,
    icon: Package,
    color: 'blue',
  },
  {
    id: 2,
    title: 'Low Stock Items',
    value: '0',
    change: '0%',
    trend: 'down' as const,
    icon: AlertTriangle,
    color: 'orange',
  },
  {
    id: 3,
    title: 'Pending Orders',
    value: '0',
    change: '0%',
    trend: 'up' as const,
    icon: Clock,
    color: 'purple',
  },
  {
    id: 4,
    title: 'Revenue Today',
    value: '$0',
    change: '0%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'green',
  },
];

const colorMap = {
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-green-600',
};

const statusColors = {
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
};

export function Dashboard() {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [stockData, setStockData] = useState<{ month: string; stock: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const metricsRef = ref(database, 'dashboard/metrics');
    const unsubscribeMetrics = onValue(metricsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMetrics(Object.values(data).map((m: any) => ({
          ...m,
          icon: [Package, AlertTriangle, Clock, DollarSign][(m.id - 1) % 4]
        })));
      }
    });

    const stockRef = ref(database, 'dashboard/stockData');
    const unsubscribeStock = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setStockData(Object.values(data));
    });

    const activityRef = ref(database, 'dashboard/recentActivity');
    const unsubscribeActivity = onValue(activityRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRecentActivity(Object.values(data));
    });

    const ordersRef = ref(database, 'dashboard/recentOrders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRecentOrders(Object.values(data));
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeStock();
      unsubscribeActivity();
      unsubscribeOrders();
    };
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Welcome back, John! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's what's happening with your inventory today
        </p>
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
                       hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                    <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMap[metric.color]} 
                              flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                           flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                           dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                           flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                           dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                           flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sync Inventory
          </button>
        </div>
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stock Level Trend
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stockData}>
              <defs>
                <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis
                dataKey="month"
                className="text-sm"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-sm"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="stock"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#stockGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 
                                              dark:border-gray-800 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                              flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.item}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {order.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {order.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {order.status}
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
