import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { ref, onValue, update, remove, push } from 'firebase/database';
import { database } from '../../lib/firebase';

const ITEMS_PER_PAGE = 6;

type InventoryItem = {
  id: string; // The key from firebase (e.g. "Green Manggo")
  name: string;
  sku: string; // ObjectID
  quantity: number;
  price: number;
  threshold: number;
  time_restock?: string;
  category: string;
  image: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

const statusColors = {
  'In Stock': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'Low Stock': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  'Out of Stock': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export function Inventory() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  // activeTab replaces viewMode. 'inventory' = Grid, 'history' = Table
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

  // Add State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    quantity: 0,
    price: 0,
    threshold: 10
  });

  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const productsRef = ref(database, 'Inventory');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedProducts: InventoryItem[] = Object.entries(data).map(([key, value]: [string, any]) => {
          // Image Logic
          let image = '/inventory/default.png'; // Fallback
          const lowerName = (value.Name || key).toLowerCase();

          if (lowerName.includes('green') && lowerName.includes('mang')) {
            image = '/inventory/green-mango.png';
          } else if (lowerName.includes('yellow') && lowerName.includes('mang')) {
            image = '/inventory/yellow-mango.png';
          } else if (lowerName.includes('rotten') && lowerName.includes('mang')) {
            image = '/inventory/rotten-mango.png';
          }

          // Status Logic
          const qty = Number(value.Quantity || 0);
          const threshold = Number(value.Threshold || 5);
          let status: InventoryItem['status'] = 'In Stock';
          if (qty === 0) status = 'Out of Stock';
          else if (qty <= threshold) status = 'Low Stock';

          return {
            id: key,
            name: value.Name || key,
            sku: value.ObjectID || 'N/A',
            quantity: qty,
            price: Number(value['Unit Price'] || 0),
            threshold: threshold,
            time_restock: value.Time_restock,
            category: 'Produce',
            image: image,
            status: status
          };
        });
        setProducts(loadedProducts);
      } else {
        setProducts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter products
  // Filter products
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Actions
  const startEdit = (product: InventoryItem) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const itemRef = ref(database, `Inventory/${editingId}`);
      await update(itemRef, {
        Name: editForm.name,
        ObjectID: editForm.sku,
        Quantity: Number(editForm.quantity),
        "Unit Price": Number(editForm.price),
        Threshold: Number(editForm.threshold) // Ensure valid number
      });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      const itemRef = ref(database, `Inventory/${deleteConfirmation.id}`);
      await remove(itemRef);
      setDeleteConfirmation(null); // Close modal on success
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewProductForm({
      name: '',
      sku: '',
      quantity: 0,
      price: 0,
      threshold: 10
    });
  };

  const handleSaveNew = async () => {
    if (!newProductForm.name || !newProductForm.sku) {
      alert("Name and Object ID are required");
      return;
    }

    try {
      const itemsRef = ref(database, 'Inventory');
      // Create a new key based on name or let push generate one
      // Using push() generates a unique key. 
      // If we want to use the Name as the key (like the existing data seems to use sometimes),
      // we would use update(). But push() is safer for unique IDs.
      // However, the existing code uses `const loadedProducts = Object.entries(data).map(([key, value])`
      // where key is used.

      await push(itemsRef, {
        Name: newProductForm.name,
        ObjectID: newProductForm.sku,
        Quantity: Number(newProductForm.quantity),
        "Unit Price": Number(newProductForm.price),
        Threshold: Number(newProductForm.threshold),
        Time_restock: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      setIsAddingNew(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your products and stock levels
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('inventory'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'inventory'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Inventory
            </button>
            <button
              onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Inventory History
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 
                           dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
                           flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      {/* Product Content */}
      {activeTab === 'inventory' ? (
        // === GRID VIEW (Inventory Tab) ===
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map(product => {
            const isEditing = editingId === product.id;
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 
                       dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-200 
                       group flex flex-col"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[product.status]}`}>
                      {product.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  {isEditing ? (
                    <div className="space-y-2 flex-1">
                      <input
                        className="w-full p-1 border rounded text-sm mb-1"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Name"
                      />
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 p-1 border rounded text-sm"
                          value={editForm.sku}
                          onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                          placeholder="Object ID"
                        />
                        <input
                          className="w-1/2 p-1 border rounded text-sm"
                          type="number"
                          value={editForm.quantity}
                          onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                          placeholder="Qty"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="w-1/2 p-1 border rounded text-sm"
                          type="number"
                          value={editForm.price}
                          onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          placeholder="Unit Price"
                        />
                        <input
                          className="w-1/2 p-1 border rounded text-sm"
                          type="number"
                          value={editForm.threshold}
                          onChange={e => setEditForm({ ...editForm, threshold: Number(e.target.value) })}
                          placeholder="Threshold"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="p-2 text-gray-500 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={product.name}>{product.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">ObjectID: {product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-600 dark:text-gray-400">Qty: {product.quantity}</span>
                        <span className="text-gray-500 text-xs">{product.time_restock?.split(' ')[0]}</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ₱{product.price.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(product)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                            text-gray-600 dark:text-gray-400 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id, product.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
                                            text-red-600 dark:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // === LIST VIEW (History Tab) ===
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ObjectID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {currentProducts.map(product => {
                const isEditing = editingId === product.id;
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            className="w-full p-1 border rounded"
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-20 p-1 border rounded"
                            value={editForm.sku}
                            onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-20 p-1 border rounded"
                            type="number"
                            value={editForm.quantity}
                            onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="w-20 p-1 border rounded"
                            type="number"
                            value={editForm.price}
                            onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          Updating...
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save className="w-4 h-4" /></button>
                            <button onClick={cancelEdit} className="text-gray-500 hover:bg-gray-50 p-1 rounded"><X className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          ₱{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[product.status]}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(product)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                                            text-gray-600 dark:text-gray-400 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(product.id, product.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 
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
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       text-gray-700 dark:text-gray-300"
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
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       text-gray-700 dark:text-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                <input
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. Green Mango"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Object ID (SKU)</label>
                <input
                  value={newProductForm.sku}
                  onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. MNG-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newProductForm.quantity}
                    onChange={e => setNewProductForm({ ...newProductForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price (₱)</label>
                  <input
                    type="number"
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={newProductForm.threshold}
                  onChange={e => setNewProductForm({ ...newProductForm, threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNew}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Product?</h2>
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
