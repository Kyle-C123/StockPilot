import { useEffect, useState } from 'react';
import {
  Download,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { ref, onValue, remove, update } from 'firebase/database';
import { database } from '../../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

type AttendanceRecord = {
  id: string; // Composite key: date_user
  dateKey: string;
  userKey: string;
  Name: string;
  RFID: string;
  Time_in: string;
  Time_out: string;
  status: 'Success' | 'Failed'; // Derived or stored
};

export function LoginHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState<AttendanceRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});

  useEffect(() => {
    if (user?.role === 'User') {
      navigate('/');
      return;
    }
    const loginHistoryRef = ref(database, 'Attendance');
    const unsubscribe = onValue(loginHistoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Flatten nested structure: { Date: { User: { ...data } } }
        const flattened: AttendanceRecord[] = [];
        Object.entries(data).forEach(([dateKey, users]) => {
          if (typeof users === 'object' && users !== null) {
            Object.entries(users).forEach(([userKey, record]: [string, any]) => {
              flattened.push({
                id: `${dateKey}_${userKey}`,
                dateKey,
                userKey,
                Name: record.Name || userKey,
                RFID: record.RFID || '',
                Time_in: record.Time_in || '',
                Time_out: record.Time_out || '',
                status: 'Success', // Default to success as it exists in attendance
              });
            });
          }
        });
        // Sort by date descending (newest first)
        flattened.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
        setLoginData(flattened);
      } else {
        setLoginData([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter data
  const filteredData = loginData.filter(item => {
    // Tab Filter
    // Use local time for comparison to match the user's perception of "Today"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const matchesTab = activeTab === 'today' ? item.dateKey === todayStr : true;

    // Search Filter
    const matchesSearch =
      (item.Name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.RFID?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleExport = () => {
    console.log('Exporting login history...');
    alert('Export functionality would download CSV/Excel file');
  };

  const handleDelete = async (item: AttendanceRecord) => {
    if (confirm(`Are you sure you want to delete record for ${item.Name} on ${item.dateKey}?`)) {
      try {
        const itemRef = ref(database, `Attendance/${item.dateKey}/${item.userKey}`);
        await remove(itemRef);
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record");
      }
    }
  };

  const startEdit = (item: AttendanceRecord) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.dateKey || !editForm.userKey) return;

    try {
      const itemRef = ref(database, `Attendance/${editForm.dateKey}/${editForm.userKey}`);
      await update(itemRef, {
        Name: editForm.Name,
        RFID: editForm.RFID,
        Time_in: editForm.Time_in,
        Time_out: editForm.Time_out
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Login History</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track and monitor all user login activities
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('today'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'today'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Today's Login
            </button>
            <button
              onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Login History
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 
                                 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                             dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                             flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {loginData.length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Today's Logins</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {loginData.filter(d => d.dateKey === new Date().toISOString().split('T')[0]).length}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RFID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                {user?.role === 'Admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No records found for {activeTab === 'today' ? "today" : "history"}.
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {editingId === item.id ? (
                      // Edit Mode
                      <>
                        <td className="px-6 py-4">
                          <input
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.Name || ''}
                            onChange={e => setEditForm({ ...editForm, Name: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.RFID || ''}
                            onChange={e => setEditForm({ ...editForm, RFID: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.dateKey}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.Time_in || ''}
                            onChange={e => setEditForm({ ...editForm, Time_in: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editForm.Time_out || ''}
                            onChange={e => setEditForm({ ...editForm, Time_out: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">Success</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="text-green-600 hover:text-green-800" title="Save">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" title="Cancel">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 
                                                flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">
                                {(item.Name || '?').split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.Name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {item.RFID || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {item.dateKey}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {item.Time_in || '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {item.Time_out || '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Success</span>
                          </div>
                        </td>
                        {user?.role === 'Admin' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => startEdit(item)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg transition-colors ${currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
