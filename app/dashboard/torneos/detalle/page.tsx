import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TournamentDetailClient from "@/components/tournament-detail";

export default async function TournamentDetailPage({ searchParams }: any) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await Promise.resolve(searchParams);
  const tournamentId = params?.id;

  if (!tournamentId) {
    redirect("/dashboard/torneos");
  }

  const clubFilter = session.clubId ? { clubId: session.clubId } : {};

  const tournament = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      ...clubFilter,
    },
    include: {
      _count: {
        select: {
          registrations: true,
          matches: true,
        },
      },
    },
  });

  if (!tournament) {
    redirect("/dashboard/torneos");
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: {
      tournamentId,
    },
    include: {
      member: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const members = await prisma.member.findMany({
    where: {
      ...clubFilter,
    },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      memberCode: "asc",
    },
  });

  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
    },
    orderBy: [
      { category: "asc" },
      { round: "asc" },
      { createdAt: "asc" },
    ],
  });

  return (
    <TournamentDetailClient
      tournament={JSON.parse(JSON.stringify(tournament))}
      registrations={JSON.parse(JSON.stringify(registrations))}
      members={JSON.parse(JSON.stringify(members))}
      matches={JSON.parse(JSON.stringify(matches))}
    />
  );
}
