import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="bg-primary shadow-md text-white">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-medium">RAG Chatbot</h1>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 rounded-full hover:bg-primary/80 transition-colors">
                  <Avatar className="h-8 w-8 bg-primary-foreground">
                    <AvatarFallback className="text-primary">U</AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent>User Profile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export default Header;
