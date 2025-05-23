"use client";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  return (
    <nav className="bg-gray-100 text-black py-4 px-6 flex justify-between items-center shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/medblocks.png"
            alt="Logo"
            width={130}
            height={130}
            className="cursor-pointer object-contain"
          />
        </Link>

        <div className="hidden lg:block">
          <ul className="flex justify-end items-center space-x-6">
            <li>
              <Link
                href="/"
                className="hover:text-blue-500 text-lg font-medium transition-colors duration-300"
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
