import "server-only";
import { listMyApplications, type MyApplication } from "@/data/applications";
import { listMyFacilities, type FinancingFacility } from "@/data/financing";
import { getMyTagihan, type TagihanOverview } from "@/data/repayments";
import { getMyStudentIdentity, type StudentIdentity } from "@/data/students";
import { getCurrentUser } from "@/lib/session";

export type DashboardSnapshot = {
  readonly name: string;
  readonly identity: StudentIdentity | null;
  readonly facility: FinancingFacility | null;
  readonly tagihan: TagihanOverview | null;
  readonly applications: readonly MyApplication[];
  readonly activeApplicationCount: number;
};

const RECENT_APPLICATION_LIMIT = 3;
const ACTIVE_APPLICATION_STATUSES: readonly string[] = [
  "draft",
  "submitted",
  "shortlisted",
  "accepted",
];

export async function getMyDashboard(): Promise<DashboardSnapshot | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const [identity, facilities, tagihan, applications] = await Promise.all([
    getMyStudentIdentity(),
    listMyFacilities(),
    getMyTagihan(),
    listMyApplications(),
  ]);
  return {
    name: user.name,
    identity,
    facility: facilities[0] ?? null,
    tagihan,
    applications: applications.slice(0, RECENT_APPLICATION_LIMIT),
    activeApplicationCount: applications.filter((item) =>
      ACTIVE_APPLICATION_STATUSES.includes(item.status),
    ).length,
  };
}
