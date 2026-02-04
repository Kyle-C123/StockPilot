import { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Settings,
  Database,
  Key,
  Activity,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';

const roleColors = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  User: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const statusColors = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'settings' | 'logs' | 'api'>('users');
  const [showApiKey, setShowApiKey] = useState<number | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  useEffect(() => {
    const usersRef = ref(database, 'admin/users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUsers(Object.values(data));
    });

    const rolesRef = ref(database, 'admin/roles');
    const unsubscribeRoles = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRoles(Object.values(data));
    });

    const logsRef = ref(database, 'admin/logs');
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setActivityLogs(Object.values(data));
    });

    const keysRef = ref(database, 'admin/apiKeys');
    const unsubscribeKeys = onValue(keysRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setApiKeys(Object.values(data));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
      unsubscribeLogs();
      unsubscribeKeys();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage users, permissions, and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">19</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 
                          flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 
                          flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">API Keys</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 
                          flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Backup</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2h ago</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 
                          flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'roles', label: 'Roles & Permissions', icon: Shield },
              { id: 'settings', label: 'System Settings', icon: Settings },
              { id: 'logs', label: 'Activity Logs', icon: Activity },
              { id: 'api', label: 'API Keys', icon: Key },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* User Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                                 flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[user.role as keyof typeof roleColors]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[user.status as keyof typeof statusColors]}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {user.lastActive}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                             text-gray-600 dark:text-gray-400 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                                             text-red-600 dark:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Roles & Permissions */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                                 flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Role
                </button>
              </div>

              <div className="grid gap-4">
                {roles.map(role => (
                  <div key={role.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {role.role}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {role.users} user{role.users !== 1 ? 's' : ''} assigned
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                         text-gray-600 dark:text-gray-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                                         text-red-600 dark:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(permission => (
                        <span
                          key={permission}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 
                                   dark:text-blue-400 text-sm rounded-full"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h2>

              <div className="grid gap-4">
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Database Backup</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last backup: 2 hours ago</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Auto backup: Enabled (Daily at 2:00 AM)</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                                       flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4" />
                        Backup Now
                      </button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                                       dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                                       flex items-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Low stock alerts</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Security alerts</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">System Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Version</p>
                      <p className="font-medium text-gray-900 dark:text-white">v2.1.4</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Environment</p>
                      <p className="font-medium text-gray-900 dark:text-white">Production</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Database Size</p>
                      <p className="font-medium text-gray-900 dark:text-white">2.4 GB</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Uptime</p>
                      <p className="font-medium text-gray-900 dark:text-white">15 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</h2>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                                 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                                 flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" />
                  Export Logs
                </button>
              </div>

              <div className="space-y-3">
                {activityLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 
                                             hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                                      flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-semibold">
                            {log.user.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{log.user}</span> {log.action}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.timestamp}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 
                                     text-gray-700 dark:text-gray-300 rounded-full">
                        {log.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                                 flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Generate Key
                </button>
              </div>

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{key.name}</h3>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {showApiKey === key.id ? 'pk_live_1234567890abcdefghij' : key.key}
                          </code>
                          <button
                            onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {showApiKey === key.id ? (
                              <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[key.status as keyof typeof statusColors]}`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex gap-4">
                        <span>Created: {key.created}</span>
                        <span>Last used: {key.lastUsed}</span>
                      </div>
                      <button className="text-red-600 dark:text-red-400 hover:underline">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
