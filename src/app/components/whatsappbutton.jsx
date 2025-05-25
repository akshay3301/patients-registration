"use client";
import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa"; // Importing WhatsApp icon

const WhatsAppButton = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleButtonClick = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  return (
    <div>
      {/* WhatsApp Button */}
      <div className="fixed bottom-16 right-4 z-50">
        <button
          onClick={handleButtonClick}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 shadow-lg text-white"
        >
          <FaWhatsapp className="w-8 h-8" />{" "}
          {/* WhatsApp icon instead of image */}
        </button>
      </div>

      {/* Popup */}
      {isPopupVisible && (
        <div className="fixed bottom-24 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
          <h2 className="text-xl font-bold mb-2 text-black">Greetings!</h2>
          <p className="text-sm mb-4 text-black">
            Thank you for choosing Paiz Shutter! Send us a Hi to start a
            conversation with me.😊
          </p>
          <a
            href="https://api.whatsapp.com/send?phone=8073342979&text=Hi%20there!"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-green-500 text-white text-center py-2 px-4 rounded mb-2 hover:bg-green-600"
          >
            Start Chat
          </a>
          <button
            onClick={handleClosePopup}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppButton;
