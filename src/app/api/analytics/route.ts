import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Clicks Over Time (Last 7 Days)
    const clicksOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

      const count = await prisma.analytics.count({
        where: {
          link: { userId },
          clickedAt: {
            gte: start,
            lt: end,
          },
        },
      });

      clicksOverTime.push({
        date: format(start, "MMM dd"),
        clicks: count,
      });
    }

    // 2. Top Links (Limit 5)
    const topLinks = await prisma.link.findMany({
      where: { userId },
      orderBy: { clicks: "desc" },
      take: 5,
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        clicks: true,
        title: true,
      },
    });

    // 3. Device Breakdown
    const devices = await prisma.analytics.groupBy({
      by: ["device"],
      where: {
        link: { userId },
      },
      _count: {
        id: true,
      },
    });
    
    // Sort devices to standard labels or fallback
    const deviceBreakdown = devices.map((d) => ({
      name: d.device || "Other",
      value: d._count.id,
    }));

    // 4. Browser Breakdown
    const browsers = await prisma.analytics.groupBy({
      by: ["browser"],
      where: {
        link: { userId },
      },
      _count: {
        id: true,
      },
    });
    const browserBreakdown = browsers.map((b) => ({
      name: b.browser || "Other",
      value: b._count.id,
    }));

    // 5. Recent Click Activity (Last 10 Clicks)
    const recentActivity = await prisma.analytics.findMany({
      where: {
        link: { userId },
      },
      orderBy: {
        clickedAt: "desc",
      },
      take: 10,
      include: {
        link: {
          select: {
            shortCode: true,
            originalUrl: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      clicksOverTime,
      topLinks,
      deviceBreakdown,
      browserBreakdown,
      recentActivity,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
