import React, { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';

const EditBankAccountModal = ({ account, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState({
    provider: account.provider || '',
    accountNumber: account.accountNumber || '',
    shopName: account.shopName || '',
    walletType: account.walletType || 'personal',
    status: account.status || 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isNew ? 'Add New Bank Account' : 'Edit Bank Account'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="provider">
              Provider *
            </label>
            <input
              id="provider"
              name="provider"
              type="text"
              required
              value={formData.provider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="accountNumber">
              Account Number *
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              required
              pattern="01\d{9}"
              title="Must be 11 digits starting with 01"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="shopName">
              Shop Name *
            </label>
            <input
              id="shopName"
              name="shopName"
              type="text"
              required
              value={formData.shopName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="walletType">
              Wallet Type
            </label>
            <select
              id="walletType"
              name="walletType"
              value={formData.walletType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>

          {!isNew && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors flex items-center"
            >
              <FaSave className="mr-2" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBankAccountModal;