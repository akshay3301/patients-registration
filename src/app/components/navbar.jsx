"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-100 text-black py-2 px-4 flex justify-between items-center shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/medblocks.png"
            alt="Logo"
            width={110}
            height={110}
            className="cursor-pointer object-contain"
          />
        </Link>

        <div className="hidden lg:block">
          <ul className="flex justify-end items-center space-x-4">
            <li>
              <Link
                href="/"
                className="hover:text-yellow-500 text-base transition-colors duration-300"
              >
                Home
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
