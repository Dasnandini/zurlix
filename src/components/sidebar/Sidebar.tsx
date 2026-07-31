import SidebarHeader from "./SidebarHeader";
import SidebarSection from "./SidebarSection";
import SidebarUpgrade from "./SidebarUpgrade";
import SidebarProfile from "./SidebarProfile";
import { sidebarSections } from "./sidebar-data";

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r shadow-sm border-gray-100 bg-white p-6">
      <SidebarHeader />

      <div className="mt-8 flex-1 space-y-6 overflow-y-auto">
        {sidebarSections.map((section, index) => (
          <div key={index}>
            <SidebarSection section={section} />

            {index !== sidebarSections.length - 1 && (
              <hr className="my-6 border-gray-200" />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* <SidebarUpgrade /> */}

        <SidebarProfile />
      </div>
    </aside>
  );
}