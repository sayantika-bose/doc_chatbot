import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const TabNavigation = () => {
  const location = useLocation();
  const isUploadActive = location.pathname === "/" || location.pathname === "";
  const isChatActive = location.pathname === "/chat";

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="flex">
          <Link
            to="/"
            className={cn(
              "px-6 py-4 text-neutral-500 hover:text-neutral-800 transition-colors",
              isUploadActive && "text-primary border-b-2 border-primary font-medium"
            )}
          >
            Document Upload
          </Link>
          <Link
            to="/chat"
            className={cn(
              "px-6 py-4 text-neutral-500 hover:text-neutral-800 transition-colors",
              isChatActive && "text-primary border-b-2 border-primary font-medium"
            )}
          >
            Chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
