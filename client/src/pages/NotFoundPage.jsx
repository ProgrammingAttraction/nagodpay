import React from 'react';
import { useNavigate } from 'react-router-dom';
import notfound_img from "../assets/notfound.png"
const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen  font-anek bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div>
            <img src={notfound_img} alt="" />
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-theme text-white font-medium cursor-pointer rounded-lg transition duration-200"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white hover:bg-gray-100 text-theme font-medium border cursor-pointer border-gray-300 rounded-lg transition duration-200"
          >
            Return Home
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-gray-500 text-sm">
        <p>Need help? <a href="/contact" className="text-theme hover:underline">Contact support</a></p>
      </div>
    </div>
  );
};

export default NotFoundPage;