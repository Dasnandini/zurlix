import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const totalLinks = await prisma.link.count({
      where: { userId },
    });

    const activeLinks = await prisma.link.count({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });

    const clicksResult = await prisma.link.aggregate({
      where: { userId },
      _sum: { clicks: true },
    });
    const totalClicks = clicksResult._sum.clicks || 0;

    const ctr = totalLinks > 0 ? (totalClicks / (totalLinks * 100 + totalClicks)) * 100 : 0;
    const averageCtr = parseFloat(ctr.toFixed(2));

    // Trends computation
    const linksThisMonth = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const linksLastMonth = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });
    const linksTrend = linksLastMonth > 0 
      ? parseFloat((((linksThisMonth - linksLastMonth) / linksLastMonth) * 100).toFixed(1))
      : linksThisMonth > 0 ? 100 : 0;

    const clicksThisMonth = await prisma.analytics.count({
      where: {
        link: { userId },
        clickedAt: { gte: thirtyDaysAgo },
      },
    });
    const clicksLastMonth = await prisma.analytics.count({
      where: {
        link: { userId },
        clickedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });
    const clicksTrend = clicksLastMonth > 0 
      ? parseFloat((((clicksThisMonth - clicksLastMonth) / clicksLastMonth) * 100).toFixed(1))
      : clicksThisMonth > 0 ? 100 : 0;

    const activeThisMonth = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });
    const activeLastMonth = await prisma.link.count({
      where: {
        userId,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: thirtyDaysAgo } },
        ],
      },
    });
    const activeTrend = activeLastMonth > 0 
      ? parseFloat((((activeThisMonth - activeLastMonth) / activeLastMonth) * 100).toFixed(1))
      : activeThisMonth > 0 ? 100 : 0;

    const prevCtr = (totalLinks - linksThisMonth) > 0 
      ? ((totalClicks - clicksThisMonth) / ((totalLinks - linksThisMonth) * 100 + (totalClicks - clicksThisMonth))) * 100 
      : 0;
    const ctrTrend = parseFloat((averageCtr - prevCtr).toFixed(2));

    return NextResponse.json({
      totalLinks,
      totalLinksTrend: linksTrend >= 0 ? `+${linksTrend}%` : `${linksTrend}%`,
      totalClicks,
      totalClicksTrend: clicksTrend >= 0 ? `+${clicksTrend}%` : `${clicksTrend}%`,
      activeLinks,
      activeLinksTrend: activeTrend >= 0 ? `+${activeTrend}%` : `${activeTrend}%`,
      averageCtr,
      averageCtrTrend: ctrTrend >= 0 ? `+${ctrTrend}%` : `${ctrTrend}%`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
