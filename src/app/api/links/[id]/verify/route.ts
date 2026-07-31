import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

function parseUserAgent(ua: string) {
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  const lowerUA = ua.toLowerCase();

  if (lowerUA.includes("chrome") || lowerUA.includes("chromium")) {
    browser = "Chrome";
  } else if (lowerUA.includes("firefox")) {
    browser = "Firefox";
  } else if (lowerUA.includes("safari") && !lowerUA.includes("chrome")) {
    browser = "Safari";
  } else if (lowerUA.includes("edge")) {
    browser = "Edge";
  } else if (lowerUA.includes("opera") || lowerUA.includes("opr")) {
    browser = "Opera";
  }

  if (lowerUA.includes("windows")) {
    os = "Windows";
  } else if (lowerUA.includes("macintosh") || lowerUA.includes("mac os")) {
    os = "macOS";
  } else if (lowerUA.includes("android")) {
    os = "Android";
  } else if (lowerUA.includes("iphone") || lowerUA.includes("ipad")) {
    os = "iOS";
  } else if (lowerUA.includes("linux")) {
    os = "Linux";
  }

  if (lowerUA.includes("mobi") || lowerUA.includes("android") || lowerUA.includes("iphone")) {
    device = "Mobile";
  } else if (lowerUA.includes("ipad") || lowerUA.includes("tablet")) {
    device = "Tablet";
  }

  return { browser, os, device };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password } = await request.json();

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ message: "Link not found" }, { status: 404 });
    }

    if (!link.passwordHash) {
      return NextResponse.json({ originalUrl: link.originalUrl });
    }

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const isValid = await bcryptjs.compare(password, link.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os, device } = parseUserAgent(userAgent);
    const referrer = request.headers.get("referer") || "Direct";
    const country = request.headers.get("x-vercel-ip-country") || "Unknown";

    await prisma.$transaction([
      prisma.link.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } }
      }),
      prisma.analytics.create({
        data: {
          linkId: link.id,
          browser,
          os,
          device,
          referrer,
          country,
        }
      })
    ]);

    return NextResponse.json({ originalUrl: link.originalUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
