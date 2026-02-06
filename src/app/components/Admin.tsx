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
  EyeOff,
  Save,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ref, onValue, push, remove, update } from 'firebase/database';
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

type UserData = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  status: 'Active' | 'Inactive';
  lastActive: string;
  password?: string;
};

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<'users' | 'create_account'>('users');
  const [showApiKey, setShowApiKey] = useState<number | null>(null);

  // State for toggling password visibility in table
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [users, setUsers] = useState<UserData[]>([]);

  // Create Account State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'User', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});

  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const usersRef = ref(database, 'accounts');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedUsers = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          name: value.username,
          email: value.email || '',
          role: value.role || 'User',
          status: value.status || 'Active',
          lastActive: value.lastActive || 'Never',
          password: value.password || ''
        }));
        setUsers(loadedUsers);
      } else {
        setUsers([]);
      }
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  // Actions
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const accountsRef = ref(database, 'accounts');
      await push(accountsRef, {
        username: newUser.name,
        email: newUser.email,
        role: newUser.role, // Simple role store
        password: newUser.password, // Ideally hashed, but storing plain for demo as requested
        status: 'Active',
        created_at: new Date().toISOString()
      });
      alert('Account Created Successfully!');
      setNewUser({ name: '', email: '', role: 'User', password: '' });
      setActiveTab('users');
    } catch (error) {
      console.error("Error creating account:", error);
      alert("Failed to create account.");
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const userRef = ref(database, `accounts/${editingId}`);
      await update(userRef, {
        username: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
        password: editForm.password
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      const userRef = ref(database, `accounts/${deleteConfirmation.id}`);
      await remove(userRef);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage system users and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 
                          flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'users', label: 'Accounts Table', icon: Users },
              { id: 'create_account', label: 'Create Account', icon: Plus },
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
          {/* Accounts Table Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing Accounts</h2>
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
                        Password
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {users.map(user => {
                      const isEditing = editingId === user.id;
                      const isPasswordVisible = visiblePasswords[user.id];
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {isEditing ? (
                            <>
                              <td className="px-4 py-4">
                                <input
                                  className="w-full p-2 border rounded-lg text-sm mb-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Username"
                                />
                                <input
                                  className="w-full p-2 border rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editForm.email}
                                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                  placeholder="Email"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  className="p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                  value={editForm.role}
                                  onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Manager">Manager</option>
                                  <option value="User">User</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  className="p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                  value={editForm.status}
                                  onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                Updating...
                              </td>
                              {/* Edit Password Field */}
                              <td className="px-4 py-4">
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={editForm.password || ''}
                                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                  placeholder="New Password"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                                  <button onClick={cancelEdit} className="p-2 text-gray-500 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[user.role as keyof typeof roleColors] || roleColors.User}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[user.status as keyof typeof statusColors] || statusColors.Active}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {user.lastActive}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">
                                    {isPasswordVisible ? user.password : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                  >
                                    {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button onClick={() => startEdit(user)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                                    text-gray-600 dark:text-gray-400 transition-colors">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(user.id, user.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                                                    text-red-600 dark:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-gray-500">No users found. Create one!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create Account Tab */}
          {activeTab === 'create_account' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Account</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Add a new user to the system.</p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    required
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="User">User</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showApiKey === 999 ? 'text' : 'password'} // Using 999 as a detailed hack or I should use a new state. Let's add a NEW state.
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(showApiKey === 999 ? null : 999)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {showApiKey === 999 ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete User?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deleteConfirmation.name}"</span>?
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
