import React, { useState, useEffect } from 'react';
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
const Slider = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [banners, setBanners] = useState([]);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch banners (images) from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get(`${base_url}/api/admin/banners`); // Correct the URL
        setBanners(response.data.filenames || []);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, []);

 // Delete image function
 const handleDeleteImage = async (imageName) => {
    try {
      // Call the delete API route
      const response = await axios.delete(`${base_url}/api/admin/banners/${imageName}`);
      if (response.status === 200) {
        toast.success("Image deleted successfully");
        setBanners((prevBanners) => prevBanners.filter((banner) => banner !== imageName));
      }
    } catch (error) {
      toast.error("Error deleting image");
      console.error("Error deleting image:", error);
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
         <section className="p-4">
        <div className="">
          <div className="w-full ">
        <h1 className='text-[25px] font-[600] mb-[20px]'>All Banenrs</h1>

            {/* Displaying images with smaller, equal width and height */}
            <div className="flex flex-wrap gap-[15px] mb-6">
              {banners.map((image, index) => (
                <div key={index} className="relative border-[2px] border-blue-400 rounded-[5px]">
                  <img
                    src={`${base_url}/images/${image}`}
                    alt={`Banner ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg" // Smaller and equal width & height (32rem)
                  />
                  <button
                    onClick={() => handleDeleteImage(image)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-[4px] cursor-pointer hover:bg-red-700"
                  >
                    <MdDelete/>
                  </button>
                </div>
              ))}
            </div>
            {banners.length === 0 && (
              <div className="text-center text-gray-500 mt-4">No images found</div>
            )}
          </div>
        </div>
      </section>
        </main>
      </div>
    </section>

  );
};

export default Slider;
