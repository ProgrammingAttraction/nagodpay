import React, { useState, useEffect } from 'react';
import Header from "../../components/Header";
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { FaEdit, FaTrash } from 'react-icons/fa';

const Reviewlist = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editData, setEditData] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${base_url}/api/admin/review`);
      setReviews(res.data);
    } catch (err) {
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete Review?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${base_url}/api/admin/review/${id}`);
        toast.success("Review deleted.");
        fetchReviews();
      } catch (error) {
        toast.error("Delete failed.");
      }
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const { _id, youtubeUrl, reviewerName, reviewText, rating } = editData;

    if (!youtubeUrl || !reviewerName || !reviewText || !rating) {
      toast.error("All fields are required.");
      return;
    }

    try {
      await axios.put(`${base_url}/api/admin/review/${_id}`, {
        youtubeUrl,
        reviewerName,
        reviewText,
        rating,
      });
      toast.success("Review updated.");
      setEditData(null);
      fetchReviews();
    } catch (err) {
      toast.error("Update failed.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="font-nunito min-h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] min-h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <h2 className="text-2xl font-bold mb-4">YouTube Reviews</h2>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
    <div className="overflow-x-auto border-[1px] rounded-lg border-gray-200">
<table className="min-w-full bg-white rounded-lg shadow-sm overflow-hidden">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3">YouTube Link</th>
                    <th className="px-4 py-3">Text</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review._id} className="border-t border-gray-300 hover:bg-gray-50">
                      <td className="px-4 py-2">{review.reviewerName}</td>
                      <td className="px-4 py-2 text-blue-600 underline">
                        <a href={review.youtubeUrl} target="_blank">Video</a>
                      </td>
                      <td className="px-4 py-2">{review.reviewText}</td>
                      <td className="px-4 py-2">{review.rating}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="p-2 bg-green-100 text-green-600 border border-green-500 rounded hover:bg-green-200"
                          onClick={() => setEditData(review)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="p-2 bg-red-100 text-red-600 border border-red-500 rounded hover:bg-red-200"
                          onClick={() => handleDelete(review._id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Update Modal */}
          {editData && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg relative">
                <h3 className="text-xl font-bold mb-4">Update Review</h3>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="youtubeUrl"
                    value={editData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="YouTube URL"
                    className="w-full border px-4 py-2 border-gray-200 rounded outline-blue-500"
                  />
                  <input
                    type="text"
                    name="reviewerName"
                    value={editData.reviewerName}
                    onChange={handleChange}
                    placeholder="Reviewer Name"
                    className="w-full border px-4 py-2 rounded border-gray-200 outline-blue-500"
                  />
                  <textarea
                    name="reviewText"
                    value={editData.reviewText}
                    onChange={handleChange}
                    placeholder="Review Text"
                    className="w-full border px-4 py-2 rounded border-gray-200 outline-blue-500"
                  ></textarea>
                  <input
                    type="number"
                    name="rating"
                    value={editData.rating}
                    onChange={handleChange}
                    placeholder="Rating (1-5)"
                    min={1}
                    max={5}
                    className="w-full border px-4 py-2 rounded border-gray-200 outline-blue-500"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditData(null)}
                      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 outline-blue-500"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Reviewlist;
