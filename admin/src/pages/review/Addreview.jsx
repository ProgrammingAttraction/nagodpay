import React, { useState } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Addreview = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const [formData, setFormData] = useState({
    youtubeUrl: '',
    reviewerName: '',
    reviewText: '',
    rating: '',
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateYoutubeUrl = (url) => {
    return /^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(url) || /^https:\/\/youtu\.be\//.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { youtubeUrl, reviewerName, reviewText, rating } = formData;

    if (!youtubeUrl || !reviewerName || !reviewText || !rating) {
      toast.error('All fields are required.');
      return;
    }

    if (!validateYoutubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL.');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5.');
      return;
    }

    try {
      await axios.post(`${base_url}/api/admin/review`, formData);
      toast.success('Review added successfully!');
      setFormData({ youtubeUrl: '', reviewerName: '', reviewText: '', rating: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <section className="font-nunito min-h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] min-h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Add YouTube Review</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">YouTube Video URL</label>
                <input
                  type="text"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Reviewer Name</label>
                <input
                  type="text"
                  name="reviewerName"
                  value={formData.reviewerName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Review Text</label>
                <textarea
                  name="reviewText"
                  value={formData.reviewText}
                  onChange={handleChange}
                  placeholder="Write your review..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Rating (1 to 5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-300"
              >
                Submit Review
              </button>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Addreview;
