"use client";

import Image from "next/image";
import logo from '@/assets/logo2.png';
import { useCreateLinkModal } from "@/context/CreateLinkModalContext";

export default function SidebarHeader() {
  const { openModal } = useCreateLinkModal();

  return (
    <div className="space-y-5">
      <Image
        src={logo}
        alt="Logo"
        width={120}
        height={34}
      />

      <button 
        onClick={() => openModal()}
        className="w-full rounded-xl bg-[#0f8f9e] py-3 text-sm font-medium text-white transition hover:bg-[#0f8f9e]/90"
      >
        Create New
      </button>
    </div>
  );
}