import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import bcryptjs from "bcryptjs";

// Helper to fetch page metadata
async function getUrlMetadata(url: string) {
  let title: string | null = null;
  let description: string | null = null;
  let favicon: string | null = null;

  try {
    const parsedUrl = new URL(url);
    favicon = `${parsedUrl.origin}/favicon.ico`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s limit
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }

      const descMatch = 
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || 
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
      if (descMatch && descMatch[1]) {
        description = descMatch[1].trim();
      }

      const favMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
      if (favMatch && favMatch[1]) {
        let favUrl = favMatch[1];
        if (!favUrl.startsWith("http")) {
          if (favUrl.startsWith("//")) {
            favUrl = "https:" + favUrl;
          } else if (favUrl.startsWith("/")) {
            favUrl = `${parsedUrl.origin}${favUrl}`;
          } else {
            favUrl = `${parsedUrl.origin}/${favUrl}`;
          }
        }
        favicon = favUrl;
      }
    }
  } catch (e) {
    console.log("Could not fetch metadata for", url, e);
  }

  return { title, description, favicon };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { originalUrl, customAlias, expiresAt, password } = body;

    if (!originalUrl) {
      return NextResponse.json(
        { message: "Original URL is required" },
        { status: 400 }
      );
    }

    let shortCode = customAlias?.trim() || "";
    if (shortCode) {
      // Validate alias format
      if (!/^[a-zA-Z0-9-_]+$/.test(shortCode)) {
        return NextResponse.json(
          { message: "Custom alias can only contain letters, numbers, hyphens, and underscores" },
          { status: 400 }
        );
      }

      // Check if alias is already taken as a shortcode or custom alias
      const existing = await prisma.link.findFirst({
        where: {
          OR: [
            { shortCode: shortCode },
            { customAlias: shortCode }
          ]
        }
      });

      if (existing) {
        return NextResponse.json(
          { message: "Custom alias is already taken" },
          { status: 400 }
        );
      }
    } else {
      // Generate a unique short code
      let isUnique = false;
      while (!isUnique) {
        shortCode = nanoid(8);
        const existing = await prisma.link.findUnique({
          where: { shortCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    // Password Hashing
    let passwordHash = null;
    if (password) {
      passwordHash = await bcryptjs.hash(password, 10);
    }

    // Fetch Metadata
    const { title, description, favicon } = await getUrlMetadata(originalUrl);

    const link = await prisma.link.create({
      data: {
        originalUrl,
        shortCode,
        customAlias: customAlias?.trim() || null,
        title: title || originalUrl.split("://")[1]?.split("/")[0] || "Short Link",
        description: description || null,
        favicon: favicon || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        passwordHash,
        userId: session.user.id,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "newest";

    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { originalUrl: { contains: search, mode: "insensitive" } },
        { shortCode: { contains: search, mode: "insensitive" } },
        { customAlias: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const now = new Date();
    if (status === "active") {
      where.AND = [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        }
      ];
    } else if (status === "expired") {
      where.expiresAt = { lte: now };
    } else if (status === "protected") {
      where.passwordHash = { not: null };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "clicks") {
      orderBy = { clicks: "desc" };
    }

    const links = await prisma.link.findMany({
      where,
      orderBy,
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}