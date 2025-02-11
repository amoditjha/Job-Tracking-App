import React from "react";
import { Github, Linkedin, Instagram, Globe } from "lucide-react";
const socialLinks = [
  {
    icon: <Github className="w-5 h-5 text-gray-600" />,
    href: "https://github.com/amoditjha",
    label: "GitHub",
  },
  {
    icon: <Linkedin className="w-5 h-5 text-blue-500" />,
    href: "https://linkedin.com/in/amoditjha",
    label: "LinkedIn",
  },
  {
    icon: <Instagram className="w-5 h-5 text-pink-500" />,
    href: "https://instagram.com/amoditjha",
    label: "Instagram",
  },
  {
    icon: <Globe className="w-5 h-5 text-purple-500" />,
    href: "https://amodits-portfolio.vercel.app/",
    label: "Portfolio",
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bottom-0 relative left-0 right-0 p-2 text-black  ">
      <div className="max-w-7xl mx-auto flex flex-col  justify-between items-center gap-4 ">
        <div className="text-text-primary text-sm flex">
        {/* <div className="flex items-center hidden md:flex lg:my-5">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span className="ml-2 text-sm font-semibold text-gray-800">
                JobTracker
              </span>
            </div> */}
          <p className=" py-1 text-indigo-600 font-semibold">
            {" "}
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {socialLinks.map(({ icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-primary hover:text-primary-light transition-colors duration-800"
              aria-label={label}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
