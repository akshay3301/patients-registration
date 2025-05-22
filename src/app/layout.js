import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";

// Load Inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Medblocks - Patients registration",
  description: "",
  keywords: "",
  robots: "index, follow",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} relative`}>
        <Navbar />
        <div className="h-full w-full overflow-auto">{children}</div>
      </body>
    </html>
  );
}
