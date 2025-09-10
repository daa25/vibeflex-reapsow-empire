import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ImportExport = () => {
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState('products');
  const [supplierType, setSupplierType] = useState('cj_dropshipping');
  const [importResults, setImportResults] = useState(null);

  const supplierTypes = [
    { value: 'cj_dropshipping', label: 'CJ Dropshipping' },
    { value: 'dsers', label: 'DSERS' },
    { value: 'autods', label: 'AutoDS' },
    { value: 'printful', label: 'Printful' },
    { value: 'printify', label: 'Printify' },
    { value: 'gelato', label: 'Gelato' },
    { value: 'pietra', label: 'Pietra' },
    { value: 'impact_affiliate', label: 'Impact.com' }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
        }

        // Send to backend
        const endpoint = importType === 'products' ? '/import/products' : '/import/orders';
        const payload = {
          supplier_type: supplierType,
          [importType]: data
        };

        const response = await axios.post(`${API}${endpoint}`, payload);
        setImportResults(response.data);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing file:', error);
      setImportResults({ error: 'Failed to import file. Please check the format and try again.' });
    } finally {
      setImporting(false);
    }
  };

  const sampleDataTemplates = {
    cj_dropshipping: {
      products: 'order_number,recipient_first_name,recipient_last_name,product_name,sku,quantity,price',
      orders: 'order_number,recipient_first_name,recipient_last_name,country,state,city,address1,postcode,phone,email,sku,product_name,quantity'
    },
    dsers: {
      products: 'OrderID,FirstName,LastName,ProductName,SKU,Quantity,Price,Currency',
      orders: 'OrderID,CreatedAt,FirstName,LastName,Email,Phone,Address1,City,Province,Country,Zip,SKU,ProductName,Quantity,Price,Currency'
    }
  };

  const downloadSampleTemplate = () => {
    const template = sampleDataTemplates[supplierType]?.[importType];
    if (!template) return;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplierType}_${importType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Import & Export</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            📥 Import Data
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="products">Products</option>
                <option value="orders">Orders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Type</label>
              <select
                value={supplierType}
                onChange={(e) => setSupplierType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {supplierTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="w-full border rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadSampleTemplate}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                📋 Download Template
              </button>
            </div>

            {importing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Importing data...</p>
              </div>
            )}

            {importResults && (
              <div className={`p-4 rounded-lg ${
                importResults.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
              }`}>
                {importResults.error ? (
                  <div>
                    <strong>Import Failed:</strong> {importResults.error}
                  </div>
                ) : (
                  <div>
                    <strong>Import Successful!</strong> {importResults.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Import from Your Files */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            🚀 Quick Import
          </h3>

          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Import your existing data files that were uploaded to the system:
            </p>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    setImporting(true);
                    // This would import from your CJ file
                    const response = await axios.post(`${API}/import/products`, {
                      supplier_type: 'cj_dropshipping',
                      products: [] // Would load from your uploaded file
                    });
                    setImportResults(response.data);
                  } catch (error) {
                    setImportResults({ error: 'Failed to import CJ products' });
                  } finally {
                    setImporting(false);
                  }
                }}
                className="w-full bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">📦 CJ Dropshipping Orders</div>
                  <div className="text-sm text-gray-600">Import your existing CJ orders</div>
                </div>
                <div className="text-blue-600">→</div>
              </button>

              <button
                onClick={async () => {
                  try {
                    setImporting(true);
                    // This would import from your DSERS file
                    const response = await axios.post(`${API}/import/orders`, {
                      supplier_type: 'dsers',
                      orders: [] // Would load from your uploaded file
                    });
                    setImportResults(response.data);
                  } catch (error) {
                    setImportResults({ error: 'Failed to import DSERS orders' });
                  } finally {
                    setImporting(false);
                  }
                }}
                className="w-full bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">🚚 DSERS Orders</div>
                  <div className="text-sm text-gray-600">Import your DSERS order history</div>
                </div>
                <div className="text-green-600">→</div>
              </button>

              <button
                onClick={async () => {
                  try {
                    setImporting(true);
                    // This would create affiliate products from your Impact file
                    const response = await axios.post(`${API}/import/products`, {
                      supplier_type: 'impact_affiliate',
                      products: [
                        {
                          name: 'Tampa Bay Rays City Connect Jersey',
                          description: 'Official Tampa Bay Rays City Connect Jersey',
                          price: 120.00,
                          cost: 0,
                          sku: 'TB-RAYS-CC',
                          affiliate_url: 'https://www.fanatics.com/mlb/tampa-bay-rays',
                          commission_rate: 0.08
                        },
                        {
                          name: 'Mike Evans #13 Bucs Jersey',
                          description: 'Official Mike Evans Tampa Bay Buccaneers Jersey',
                          price: 99.99,
                          cost: 0,
                          sku: 'TB-BUCS-EVANS',
                          affiliate_url: 'https://www.fanatics.com/nfl/tampa-bay-buccaneers/mike-evans',
                          commission_rate: 0.08
                        }
                      ]
                    });
                    setImportResults(response.data);
                  } catch (error) {
                    setImportResults({ error: 'Failed to import Impact products' });
                  } finally {
                    setImporting(false);
                  }
                }}
                className="w-full bg-purple-50 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-100 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">🎯 Impact.com Products</div>
                  <div className="text-sm text-gray-600">Import Tampa Bay sports merchandise</div>
                </div>
                <div className="text-purple-600">→</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          📤 Export Data
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 text-center">
            <div className="font-medium">Export Products</div>
            <div className="text-sm text-gray-600">Download all products as CSV</div>
          </button>

          <button className="bg-green-50 text-green-700 px-4 py-3 rounded-lg hover:bg-green-100 text-center">
            <div className="font-medium">Export Orders</div>
            <div className="text-sm text-gray-600">Download all orders as CSV</div>
          </button>

          <button className="bg-purple-50 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-100 text-center">
            <div className="font-medium">Export Suppliers</div>
            <div className="text-sm text-gray-600">Download supplier list as CSV</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;