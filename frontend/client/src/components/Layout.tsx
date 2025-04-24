import { ReactNode } from "react";
import Header from "./Header";
import TabNavigation from "./TabNavigation";
import HealthCheck from "./HealthCheck";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      <TabNavigation />
      <div className="container mx-auto px-4">
        <HealthCheck />
      </div>
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
