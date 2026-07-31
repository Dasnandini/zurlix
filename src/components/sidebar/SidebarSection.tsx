import SidebarItem from "./SidebarItem";
import { SidebarSection as Section } from "./types";

interface Props {
  section: Section;
}

export default function SidebarSection({ section }: Props) {
  return (
    <div className="space-y-1">
      {section.items.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
    </div>
  );
}