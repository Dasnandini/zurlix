import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ message: "Link not found" }, { status: 404 });
    }

    if (link.userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await prisma.link.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { originalUrl, customAlias, expiresAt, password, removePassword } = body;

    const link = await prisma.link.findUnique({
      where: { id },
    });

    if (!link) {
      return NextResponse.json({ message: "Link not found" }, { status: 404 });
    }

    if (link.userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updateData: any = {};

    if (originalUrl !== undefined) {
      if (!originalUrl) {
        return NextResponse.json(
          { message: "Original URL is required" },
          { status: 400 }
        );
      }
      updateData.originalUrl = originalUrl;
      
      try {
        const parsedUrl = new URL(originalUrl);
        updateData.favicon = `${parsedUrl.origin}/favicon.ico`;
        updateData.title = originalUrl.split("://")[1]?.split("/")[0] || "Short Link";
      } catch (e) {}
    }

    if (customAlias !== undefined) {
      const newAlias = customAlias?.trim() || null;
      if (newAlias && newAlias !== link.customAlias) {
        if (!/^[a-zA-Z0-9-_]+$/.test(newAlias)) {
          return NextResponse.json(
            { message: "Custom alias can only contain letters, numbers, hyphens, and underscores" },
            { status: 400 }
          );
        }

        const existing = await prisma.link.findFirst({
          where: {
            OR: [
              { shortCode: newAlias },
              { customAlias: newAlias }
            ],
            id: { not: id }
          }
        });

        if (existing) {
          return NextResponse.json(
            { message: "Custom alias is already taken" },
            { status: 400 }
          );
        }
        
        updateData.customAlias = newAlias;
        updateData.shortCode = newAlias;
      } else if (newAlias === null && link.customAlias !== null) {
        const { nanoid } = await import("nanoid");
        let shortCode = "";
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
        updateData.customAlias = null;
        updateData.shortCode = shortCode;
      }
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (removePassword) {
      updateData.passwordHash = null;
    } else if (password !== undefined) {
      if (password) {
        updateData.passwordHash = await bcryptjs.hash(password, 10);
      }
    }

    const updated = await prisma.link.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
