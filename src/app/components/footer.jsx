import React from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa"; // Import the Facebook and Instagram icons from react-icons

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">About Me</h3>
            <p className="mb-4">
              Capturing moments, telling stories. As a professional
              photographer, my mission is to freeze the beauty of life through
              my lens. Join me in exploring the art of photography.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/aboutus" className="hover:text-white">
                  Portfolio
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Follow Me</h3>
            <div className="flex justify-center md:justify-start space-x-6">
              {/* Facebook Icon */}
              <a
                href="https://www.facebook.com/profile.php?id=61566443120639"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-500 transition-colors duration-300"
              >
                <FaFacebook className="text-3xl md:text-4xl" />
              </a>

              {/* Instagram Icon */}
              <a
                href="https://www.instagram.com/paiz_shutter/?igsh=MW0yOXNpemozdWQwZA%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pink-500 transition-colors duration-300"
              >
                <FaInstagram className="text-3xl md:text-4xl" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-gray-700 pt-4 text-center md:text-left">
          <p>&copy; 2024 Paiz Shutter Photography. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
