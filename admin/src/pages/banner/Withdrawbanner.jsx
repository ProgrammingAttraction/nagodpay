import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Withdrawbanner = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banners, setBanners] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBannerId, setCurrentBannerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch all banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/admin/banners`);
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setErrors({
          ...errors,
          image: 'Please select an image file'
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          image: 'Image size must be less than 5MB'
        });
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      if (errors.image) {
        setErrors({
          ...errors,
          image: ''
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!isEditing && !imageFile) {
      newErrors.image = 'Image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      
      if (imageFile) {
        data.append('bannerImage', imageFile);
      }
      
      let response;
      
      if (isEditing) {
        response = await axios.put(`${base_url}/api/admin/banners/${currentBannerId}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post(`${base_url}/api/admin/banners`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message || 'Banner saved successfully',
          confirmButtonColor: '#4361ee',
        });
        
        resetForm();
        fetchBanners();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save banner');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setImagePreview(banner.imageUrl);
    setCurrentBannerId(banner._id);
    setIsEditing(true);
    
    document.getElementById('banner-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${base_url}/api/admin/banners/${id}`);
        
        if (response.data.success) {
          Swal.fire(
            'Deleted!',
            response.data.message || 'Banner has been deleted.',
            'success'
          );
          
          fetchBanners();
          
          if (currentBannerId === id) {
            resetForm();
          }
        }
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error(error.response?.data?.message || 'Failed to delete banner');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.patch(`${base_url}/api/admin/banners/${id}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        fetchBanners();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setIsEditing(false);
    setCurrentBannerId(null);
  };

  return (
    <section className="font-nunito w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] w-full">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6" id="banner-form">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Banner Management</h1>
                <p className="text-gray-600">
                  {isEditing ? 'Edit existing banner' : 'Upload new banner image'}
                </p>
              </div>
              
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Image {!isEditing && '*'}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Banner preview"
                          className="mx-auto h-40 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="bannerImage" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input
                              id="bannerImage"
                              name="bannerImage"
                              type="file"
                              className="sr-only"
                              onChange={handleImageChange}
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
              
              <div className="flex justify-end mt-4 space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Banner' : 'Upload Banner'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Banner List</h2>
              <button
                onClick={fetchBanners}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading banners...</p>
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No banners</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading a new banner.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner) => (
                  <div key={banner._id} className={`border rounded-lg overflow-hidden shadow-sm ${banner._id === currentBannerId ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={banner.imageUrl} 
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mt-4 flex justify-between items-center">
                        <button
                          onClick={() => handleToggleStatus(banner._id, banner.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            banner.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </button>
                        
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit(banner)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(banner._id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Withdrawbanner;