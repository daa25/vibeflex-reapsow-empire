import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cj_dropshipping',
    api_endpoint: '',
    api_key: '',
    webhook_url: '',
    settings: {}
  });

  const supplierTypes = [
    { value: 'cj_dropshipping', label: 'CJ Dropshipping' },
    { value: 'dsers', label: 'DSERS' },
    { value: 'autods', label: 'AutoDS' },
    { value: 'printful', label: 'Printful' },
    { value: 'printify', label: 'Printify' },
    { value: 'gelato', label: 'Gelato' },
    { value: 'pietra', label: 'Pietra' },
    { value: 'impact_affiliate', label: 'Impact.com' },
    { value: 'direct', label: 'Direct' }
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const supplierData = {
        ...formData,
        settings: typeof formData.settings === 'string' ? JSON.parse(formData.settings || '{}') : formData.settings
      };

      if (editingSupplier) {
        await axios.put(`${API}/suppliers/${editingSupplier.id}`, supplierData);
      } else {
        await axios.post(`${API}/suppliers`, supplierData);
      }

      setFormData({
        name: '', type: 'cj_dropshipping', api_endpoint: '', api_key: '', webhook_url: '', settings: {}
      });
      setShowForm(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      type: supplier.type,
      api_endpoint: supplier.api_endpoint || '',
      api_key: supplier.api_key || '',
      webhook_url: supplier.webhook_url || '',
      settings: JSON.stringify(supplier.settings || {}, null, 2)
    });
    setShowForm(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`${API}/suppliers/${supplierId}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const getSupplierIcon = (type) => {
    const icons = {
      cj_dropshipping: '📦',
      dsers: '🚚',
      autods: '🤖',
      printful: '👕',
      printify: '🎨',
      gelato: '🖨️',
      pietra: '💎',
      impact_affiliate: '🎯',
      direct: '🏪'
    };
    return icons[type] || '📋';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Supplier Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSupplier(null);
            setFormData({
              name: '', type: 'cj_dropshipping', api_endpoint: '', api_key: '', webhook_url: '', settings: {}
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium mb-4">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Supplier name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border rounded-lg px-3 py-2"
              required
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="border rounded-lg px-3 py-2"
              required
            >
              {supplierTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="API Endpoint (optional)"
              value={formData.api_endpoint}
              onChange={(e) => setFormData({...formData, api_endpoint: e.target.value})}
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="password"
              placeholder="API Key (optional)"
              value={formData.api_key}
              onChange={(e) => setFormData({...formData, api_key: e.target.value})}
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="url"
              placeholder="Webhook URL (optional)"
              value={formData.webhook_url}
              onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
              className="border rounded-lg px-3 py-2 md:col-span-2"
            />
            <textarea
              placeholder="Settings (JSON format)"
              value={typeof formData.settings === 'string' ? formData.settings : JSON.stringify(formData.settings, null, 2)}
              onChange={(e) => setFormData({...formData, settings: e.target.value})}
              className="border rounded-lg px-3 py-2 md:col-span-2"
              rows={3}
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {editingSupplier ? 'Update' : 'Add'} Supplier
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="text-3xl mr-3">{getSupplierIcon(supplier.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{supplier.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {supplier.api_endpoint && (
                <div>
                  <span className="font-medium">API:</span> {supplier.api_endpoint.substring(0, 30)}...
                </div>
              )}
              {supplier.webhook_url && (
                <div>
                  <span className="font-medium">Webhook:</span> Configured
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span> {new Date(supplier.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(supplier)}
                className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(supplier.id)}
                className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No suppliers configured</h3>
          <p className="text-gray-600 mb-4">Add your first supplier to start managing your dropshipping business!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add First Supplier
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;