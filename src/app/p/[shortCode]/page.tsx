import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PasswordForm from "./PasswordForm";
import Link from "next/link";
import { Lock } from "lucide-react";

export default async function PasswordPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  
  const link = await prisma.link.findFirst({
    where: {
      OR: [
        { shortCode },
        { customAlias: shortCode },
      ],
    },
    select: {
      id: true,
      title: true,
      favicon: true,
    },
  });

  if (!link) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center border border-slate-100">
        <div className="flex justify-center mb-5">
          {link.favicon ? (
            <div className="relative">
              <img
                src={link.favicon}
                alt="Site Icon"
                className="h-16 w-16 rounded-full border bg-white p-3 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 rounded-full bg-[#0f8f9e] p-1 text-white shadow-xs">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-[#0f8f9e] shadow-xs">
              <Lock className="h-7 w-7" />
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-800">Password Required</h1>
        <p className="text-sm text-slate-500 mt-2 mb-6 px-2">
          The link <span className="font-semibold text-slate-700">"{link.title || shortCode}"</span> is password protected. Enter the password below to access the destination URL.
        </p>

        <PasswordForm linkId={link.id} />
        
        <div className="mt-6 border-t pt-4">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-[#0f8f9e] transition">
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
