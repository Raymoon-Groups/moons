import { Injectable } from '@nestjs/common';
import { AuthActivityType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminOverview(days = 14) {
    const windowDays = Math.min(Math.max(days, 7), 60);
    const since = daysAgo(windowDays - 1);
    const todayStart = startOfDay(new Date());
    const weekStart = daysAgo(6);

    const [
      totalUsers,
      candidates,
      recruiters,
      signupsToday,
      loginsToday,
      signupsWeek,
      loginsWeek,
      recentSignups,
      recentLogins,
      activityRows,
      usersInWindow,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CANDIDATE } }),
      this.prisma.user.count({ where: { role: UserRole.RECRUITER } }),
      this.prisma.authActivity.count({
        where: { type: AuthActivityType.SIGNUP, createdAt: { gte: todayStart } },
      }),
      this.prisma.authActivity.count({
        where: { type: AuthActivityType.LOGIN, createdAt: { gte: todayStart } },
      }),
      this.prisma.authActivity.count({
        where: { type: AuthActivityType.SIGNUP, createdAt: { gte: weekStart } },
      }),
      this.prisma.authActivity.count({
        where: { type: AuthActivityType.LOGIN, createdAt: { gte: weekStart } },
      }),
      this.prisma.authActivity.findMany({
        where: { type: AuthActivityType.SIGNUP },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.authActivity.findMany({
        where: { type: AuthActivityType.LOGIN },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { profile: { select: { fullName: true } } } },
        },
      }),
      this.prisma.authActivity.findMany({
        where: { createdAt: { gte: since } },
        select: { type: true, createdAt: true },
      }),
      // Fallback for joins before AuthActivity existed
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const dailyMap = new Map<string, { date: string; signups: number; logins: number }>();
    for (let i = 0; i < windowDays; i++) {
      const d = daysAgo(windowDays - 1 - i);
      const key = dayKey(d);
      dailyMap.set(key, { date: key, signups: 0, logins: 0 });
    }

    for (const row of activityRows) {
      const key = dayKey(row.createdAt);
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      if (row.type === AuthActivityType.SIGNUP) bucket.signups += 1;
      else bucket.logins += 1;
    }

    // If auth_activities has no signup history yet, show user.createdAt as joins.
    const trackedSignups = activityRows.filter((r) => r.type === AuthActivityType.SIGNUP).length;
    if (trackedSignups === 0) {
      for (const u of usersInWindow) {
        const key = dayKey(u.createdAt);
        const bucket = dailyMap.get(key);
        if (bucket) bucket.signups += 1;
      }
    }

    const mapActivity = (
      row: (typeof recentSignups)[number] | (typeof recentLogins)[number],
    ) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      method: row.method,
      type: row.type,
      fullName: row.user.profile?.fullName ?? null,
      createdAt: row.createdAt.toISOString(),
    });

    // Prefer live AuthActivity; if empty, fall back to newest users as "joined".
    let recentJoins = recentSignups.map(mapActivity);
    if (recentJoins.length === 0) {
      const fallbackUsers = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { profile: { select: { fullName: true } } },
      });
      recentJoins = fallbackUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        method: u.googleId ? ('GOOGLE' as const) : ('PASSWORD' as const),
        type: 'SIGNUP' as const,
        fullName: u.profile?.fullName ?? null,
        createdAt: u.createdAt.toISOString(),
      }));
    }

    return {
      summary: {
        totalUsers,
        candidates,
        recruiters,
        signupsToday:
          trackedSignups > 0 || recentSignups.length > 0
            ? signupsToday
            : await this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        loginsToday,
        signupsWeek:
          trackedSignups > 0 || recentSignups.length > 0
            ? signupsWeek
            : await this.prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
        loginsWeek,
      },
      daily: Array.from(dailyMap.values()),
      recentJoins,
      recentLogins: recentLogins.map(mapActivity),
    };
  }
}
