import { useState } from "react";
import { FaCloudUploadAlt, FaTrash, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function AddSlider() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const acceptedFileTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [...images];
    
    // Check if adding these files would exceed reasonable limit
    if (files.length + images.length > 10) {
      toast.error("Maximum 10 images allowed at once");
      return;
    }

    files.forEach((file) => {
      if (!acceptedFileTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Please upload PNG, JPG, or JPEG.`);
        return;
      }

      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name}. Max size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({ 
          file, 
          preview: reader.result,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
        });
        setImages([...newImages]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    images.forEach((img) =>formData.append("images", img.file));

    try {
      const response = await axios.post(`${base_url}/api/admin/upload`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem('adminToken')}`
        },
      });

      toast.success(response.data.message || "Slider images uploaded successfully!");
      setImages([]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error uploading images. Please try again.";
      toast.error(errorMessage);
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="font-nunito min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
    
      <div className="flex pt-[10vh] min-h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />
    
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Slider Image Management</h1>
                <p className="text-gray-600 mt-2">Upload images for the homepage slider</p>
              </div>

              {/* Upload Area */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slider Images
                  <span className="text-gray-500 ml-1">(PNG, JPG up to 5MB)</span>
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {/* Image Previews */}
                  {images.map((img, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={img.preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => removeImage(index)}
                          className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full transition"
                          title="Remove image"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate">{img.name}</p>
                        <p className="text-xs text-gray-500">{img.size}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Upload Button */}
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaCloudUploadAlt className="text-blue-500 text-3xl mb-2" />
                      <p className="text-sm text-gray-600">Click to upload</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      multiple  
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                </div>
                
                <p className="text-xs text-gray-500">
                  {images.length} image{images.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || images.length === 0}
                  className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    isLoading || images.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Images'
                  )}
                </button>
              </div>
            </div>
            
            {/* Guidelines */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Guidelines</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Recommended image dimensions: 1920x1080 pixels</li>
                <li>Maximum file size: 5MB per image</li>
                <li>Supported formats: PNG, JPG, JPEG</li>
                <li>For best results, use high-quality images with minimal text</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}