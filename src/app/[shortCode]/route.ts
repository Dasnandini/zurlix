import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  request: Request,
  context: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await context.params;

    // Search link by shortCode or customAlias
    const link = await prisma.link.findFirst({
      where: {
        OR: [
          { shortCode: shortCode },
          { customAlias: shortCode }
        ]
      }
    });

    if (!link) {
      return new NextResponse("Short link not found", { status: 404 });
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt) <= new Date()) {
      return new NextResponse("This short link has expired", { status: 410 });
    }

    // Check password protection
    if (link.passwordHash) {
      // Redirect to password challenge page
      const url = new URL(`/p/${shortCode}`, request.url);
      return NextResponse.redirect(url.toString());
    }

    // Record Analytics
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

    // Redirect to destination
    return NextResponse.redirect(link.originalUrl);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
