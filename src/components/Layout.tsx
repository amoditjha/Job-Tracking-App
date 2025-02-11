import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  LogOut,
  Menu,
  XCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Footer } from "../pages/Footer";

export function Layout() {
  const location = useLocation();
  const { signOut, userDetails } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Applications", href: "/applications", icon: Briefcase },
    { name: "Resumes", href: "/resumes", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br overflow-hidden  from-indigo-100 via-purple-100 to-pink-100">
      {/* Mobile Navbar */}
      <div
        className={`md:hidden fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-white z-40`}
      >
        <h1 className="text-xl flex font-semibold text-gray-800">
          <Briefcase className="w-8 h-8 text-indigo-600" />
          <span className="pl-1 pt-1">JobTracker</span>
        </h1>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-gray-600"
        >
          <Menu
            className={`w-6 h-6 transform transition-transform z-40 md:relative md:translate-x-0
                      ${!isSidebarOpen ? "translate-x-0" : "translate-x-10"}`}
          />
        </button>
      </div>

      <div className="flex h-screen relative">
        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-0 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`absolute left-0 h-screen p-2 w-60 bg-white  transform transition-transform z-30 md:mt-0 md:top-0 md:relative md:translate-x-0
                      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
            <div>
              <div className="flex items-center md:flex lg:my-5">
                <Briefcase className="w-8 h-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-800">
                  JobTracker
                </span>
              </div>
              <div className=" py-2 mt-4 text-gray-700 text-sm text-indigo-600 font-medium md:hidden">
                {userDetails
                  ? `Welcome, ${userDetails.full_name}!`
                  : "Welcome, User!"}
              </div>
            </div>
            {/* Close Button for Mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-600"
            >
              <XCircle className={`w-6 h-6 mt-12 shadow-md rounded-xl`} />
            </button>
          </div>
          <nav className="flex-2 px-2 space-y-1 mt-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isLinkDisabled = !userDetails; // Check if userDetails is available

              return (
                <Link
                  key={item.name}
                  to={isLinkDisabled ? "#" : item.href} // Conditional link path
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? "px-4 bg-indigo-50 shadow-md text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } 
                  `} // ${isLinkDisabled ? "cursor-not-allowed text-gray-400" : ""}Disable styles
                  onClick={(e) => {
                    if (isLinkDisabled) {
                      e.preventDefault(); // Prevent navigation if the link is disabled
                      setIsSidebarOpen(false);
                    } else {
                      setIsSidebarOpen(false); // Close sidebar on click
                    }
                  }}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 ${
                      isActive ? "text-indigo-600" : "text-gray-400"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <div className={` flex flex-col `}>
            <div className=" py-4">
              <button
                onClick={() => {
                  signOut();
                  setIsSidebarOpen(false); // Close sidebar on logout
                }}
                className={`p-4 border-t border-b w-full border-gray-300 flex items-center text-orange-600 hover:text-red-600 transition-colors duration-200 ${
                  !userDetails ? "hidden" : "text-indigo-500"
                }`}
              >
                <LogOut className="mr-3 h-6 w-6" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
          <div className="mt-[25vh] border border-purple-100 m-2 rounded-md bg-purple-600/5 shadow-md">
            <Footer />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
