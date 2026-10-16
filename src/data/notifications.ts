import "server-only";
import { jakartaPlainDateOf } from "@/domain/account/age";
import { db } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/session";
import { latestOf, listMyPayments } from "./payments";
import { getMyTagihan } from "./repayments";

export type NotificationTone = "info" | "success" | "warning" | "danger";

export type AppNotification = {
  readonly id: string;
  readonly tone: NotificationTone;
  readonly title: string;
  readonly description: string;
  readonly occurredAt: string;
};

type DecidedApplicationRow = {
  id: string;
  status: string;
  decided_at: string | null;
  title: string;
};

const REMINDER_WINDOW_DAYS = 30;
const MAX_NOTIFICATIONS = 24;

const SELECT_DECIDED_APPLICATIONS = `SELECT a.id, a.status, a.decided_at,
  j.title
FROM job_applications a
JOIN job_postings j ON j.id = a.job_posting_id
JOIN students s ON s.id = a.student_id
WHERE s.user_id = ?
  AND a.status IN ('shortlisted', 'accepted', 'rejected')
  AND a.decided_at IS NOT NULL
ORDER BY a.decided_at DESC, a.id DESC
LIMIT 5`;

function dayGap(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) /
      86_400_000,
  );
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDue(dueDate: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dueDate}T00:00:00.000Z`));
}

function applicationNotifications(
  rows: readonly DecidedApplicationRow[],
): AppNotification[] {
  return rows.map((row) => {
    const occurredAt = row.decided_at ?? `${row.title}`;
    if (row.status === "shortlisted") {
      return {
        id: `application-${row.id}`,
        tone: "info" as const,
        title: "Lamaran masuk daftar pendek",
        description: `${row.title} menandai lamaranmu sebagai kandidat kuat. Pantau terus kabar berikutnya.`,
        occurredAt,
      };
    }
    if (row.status === "accepted") {
      return {
        id: `application-${row.id}`,
        tone: "success" as const,
        title: "Lamaran diterima",
        description: `Selamat! Kamu diterima untuk posisi ${row.title}. Detail penempatan akan dihubungi lewat kontak akunmu.`,
        occurredAt,
      };
    }
    return {
      id: `application-${row.id}`,
      tone: "info" as const,
      title: "Lamaran belum berhasil",
      description: `Posisi ${row.title} kali ini belum berjodoh. Lowongan lain di /kerja masih terbuka.`,
      occurredAt,
    };
  });
}

export async function getMyNotifications(): Promise<
  readonly AppNotification[]
> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const [tagihan, payments, applicationRows] = await Promise.all([
    getMyTagihan(),
    listMyPayments(),
    db.prepare(SELECT_DECIDED_APPLICATIONS).all<DecidedApplicationRow>(user.id),
  ]);
  const notifications: AppNotification[] = [];
  notifications.push(...applicationNotifications(applicationRows));
  if (tagihan !== null) {
    const byInstallment = latestOf(payments);
    for (const item of tagihan.installments) {
      const payment = byInstallment.get(item.id);
      if (payment !== undefined && payment.status === "submitted") {
        notifications.push({
          id: `payment-pending-${payment.id}`,
          tone: "info",
          title: `Bukti transfer cicilan ${item.periodNo} menunggu verifikasi`,
          description: `Kami sudah menerima bukti transfer ${formatAmount(payment.amount)} dari ${payment.senderName}. Petugas memeriksa maksimal 1 hari kerja.`,
          occurredAt: payment.submittedAt,
        });
        continue;
      }
      if (payment !== undefined && payment.status === "rejected") {
        notifications.push({
          id: `payment-rejected-${payment.id}`,
          tone: "danger",
          title: `Bukti transfer cicilan ${item.periodNo} ditolak`,
          description: `${payment.rejectionReason ?? "Bukti tidak sesuai."} Unggah ulang bukti transfer dari halaman Tagihan.`,
          occurredAt: payment.verifiedAt ?? payment.submittedAt,
        });
        continue;
      }
      if (payment !== undefined && payment.status === "verified") {
        notifications.push({
          id: `payment-verified-${payment.id}`,
          tone: "success",
          title: `Cicilan ${item.periodNo} terverifikasi`,
          description: `Pembayaran ${formatAmount(payment.amount)} sudah dicatat. Terima kasih sudah tepat waktu.`,
          occurredAt: payment.verifiedAt ?? payment.submittedAt,
        });
        continue;
      }
      if (item.status === "paid" || item.status === "waived") continue;
      const today = jakartaPlainDateOf(new Date());
      if (today === null) continue;
      const gap = dayGap(today, item.dueDate);
      if (gap < 0) {
        notifications.push({
          id: `due-overdue-${item.periodNo}`,
          tone: "danger",
          title: `Cicilan ${item.periodNo} lewat jatuh tempo`,
          description: `Tagihan ${formatAmount(item.total)} sudah melewati ${formatDue(item.dueDate)} selama ${Math.abs(gap)} hari. Segera bayar agar tidak kena denda.`,
          occurredAt: `${item.dueDate}T00:00:01.000Z`,
        });
        continue;
      }
      if (gap <= REMINDER_WINDOW_DAYS) {
        notifications.push({
          id: `due-soon-${item.periodNo}`,
          tone: "warning",
          title: `Cicilan ${item.periodNo} jatuh tempo ${formatDue(item.dueDate)}`,
          description:
            gap === 0
              ? `Hari ini jatuh temponya. Tagihan ${formatAmount(item.total)} — bayar lalu unggah bukti transfernya.`
              : `${gap} hari lagi. Tagihan ${formatAmount(item.total)} — siapkan dananya, lalu unggah bukti transfer lewat halaman Tagihan.`,
          occurredAt: `${item.dueDate}T00:00:01.000Z`,
        });
      }
    }
    if (tagihan.totalCount > 0 && tagihan.paidCount === tagihan.totalCount) {
      const latestVerified = payments.find(
        (payment) => payment.status === "verified",
      );
      notifications.push({
        id: `paid-off-${tagihan.facilityPublicRef}`,
        tone: "success",
        title: "Pembiayaanmu lunas",
        description: `Semua ${tagihan.totalCount} cicilan ${tagihan.facilityPublicRef} sudah lunas. Terima kasih sudah menyelesaikan tanggung jawabmu.`,
        occurredAt: latestVerified?.verifiedAt ?? tagihan.activatedAt,
      });
    }
  }
  return notifications
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, MAX_NOTIFICATIONS);
}
