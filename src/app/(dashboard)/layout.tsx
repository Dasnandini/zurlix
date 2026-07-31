import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { CreateLinkModalProvider } from "@/context/CreateLinkModalContext";
import CreateLinkModal from "@/components/CreateLinkModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreateLinkModalProvider>
      <div className="flex h-screen bg-[#fafafa]">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      
      <CreateLinkModal />
    </CreateLinkModalProvider>
  );
}