import { AppError } from "../utils/errors";
import { prisma } from "../config/prisma";
import { NotificationService } from "./notification.service";
import { AuditService } from "./audit.service";

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email) {
    return null;
  }
  return email;
}

function normalizePhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) {
    return null;
  }
  return phone;
}

export class MarketingService {
  static async sendPromotionalEmail(params: {
    consultancyId: string;
    actorUserId: string;
    subject: string;
    message: string;
    recipients?: string[];
    includeUsers?: boolean;
    includeStudents?: boolean;
    includeLeads?: boolean;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const recipients = await this.collectEmailRecipients({
      consultancyId: params.consultancyId,
      manualRecipients: params.recipients,
      includeUsers: params.includeUsers,
      includeStudents: params.includeStudents,
      includeLeads: params.includeLeads,
    });

    if (recipients.length === 0) {
      throw new AppError(400, "NO_RECIPIENTS", "No valid email recipients found");
    }

    const { sent, failed, failures } = await this.dispatchEmails(
      params.consultancyId,
      recipients,
      params.subject,
      params.message,
    );

    await AuditService.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId,
      action: "marketing.email.sent",
      entityType: "MarketingCampaign",
      entityId: null,
      meta: {
        requestId: params.requestId,
        subject: params.subject,
        totalRecipients: recipients.length,
        sent,
        failed,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return {
      subject: params.subject,
      totalRecipients: recipients.length,
      sent,
      failed,
      failures,
    };
  }

  static async sendPromotionalSms(params: {
    consultancyId: string;
    actorUserId: string;
    message: string;
    recipients?: string[];
    includeUsers?: boolean;
    includeStudents?: boolean;
    includeLeads?: boolean;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const recipients = await this.collectPhoneRecipients({
      consultancyId: params.consultancyId,
      manualRecipients: params.recipients,
      includeUsers: params.includeUsers,
      includeStudents: params.includeStudents,
      includeLeads: params.includeLeads,
    });

    if (recipients.length === 0) {
      throw new AppError(400, "NO_RECIPIENTS", "No valid phone recipients found");
    }

    const { sent, failed, failures } = await this.dispatchSms(
      params.consultancyId,
      recipients,
      params.message,
    );

    await AuditService.log({
      consultancyId: params.consultancyId,
      actorUserId: params.actorUserId,
      action: "marketing.sms.sent",
      entityType: "MarketingCampaign",
      entityId: null,
      meta: {
        requestId: params.requestId,
        totalRecipients: recipients.length,
        sent,
        failed,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return {
      totalRecipients: recipients.length,
      sent,
      failed,
      failures,
    };
  }

  private static async collectEmailRecipients(params: {
    consultancyId: string;
    manualRecipients?: string[];
    includeUsers?: boolean;
    includeStudents?: boolean;
    includeLeads?: boolean;
  }) {
    const recipientSet = new Set<string>();

    for (const item of params.manualRecipients ?? []) {
      const email = normalizeEmail(item);
      if (email) {
        recipientSet.add(email);
      }
    }

    const shouldIncludeDirectory =
      params.includeUsers || params.includeStudents || params.includeLeads;

    if (!shouldIncludeDirectory) {
      this.enforceRecipientLimit(recipientSet.size);
      return Array.from(recipientSet);
    }

    if (params.includeUsers) {
      const users = await prisma.user.findMany({
        where: {
          consultancyId: params.consultancyId,
          deletedAt: null,
        },
        select: { email: true },
      });
      for (const user of users) {
        const email = normalizeEmail(user.email);
        if (email) {
          recipientSet.add(email);
        }
      }
    }

    if (params.includeStudents) {
      const students = await prisma.student.findMany({
        where: {
          consultancyId: params.consultancyId,
          email: { not: null },
        },
        select: { email: true },
      });
      for (const student of students) {
        const email = normalizeEmail(student.email ?? "");
        if (email) {
          recipientSet.add(email);
        }
      }
    }

    if (params.includeLeads) {
      const leads = await prisma.lead.findMany({
        where: {
          consultancyId: params.consultancyId,
          email: { not: null },
        },
        select: { email: true },
      });
      for (const lead of leads) {
        const email = normalizeEmail(lead.email ?? "");
        if (email) {
          recipientSet.add(email);
        }
      }
    }

    this.enforceRecipientLimit(recipientSet.size);
    return Array.from(recipientSet);
  }

  private static async collectPhoneRecipients(params: {
    consultancyId: string;
    manualRecipients?: string[];
    includeUsers?: boolean;
    includeStudents?: boolean;
    includeLeads?: boolean;
  }) {
    const recipientSet = new Set<string>();

    for (const item of params.manualRecipients ?? []) {
      const phone = normalizePhone(item);
      if (phone) {
        recipientSet.add(phone);
      }
    }

    const shouldIncludeDirectory =
      params.includeUsers || params.includeStudents || params.includeLeads;

    if (!shouldIncludeDirectory) {
      this.enforceRecipientLimit(recipientSet.size);
      return Array.from(recipientSet);
    }

    if (params.includeUsers) {
      const users = await prisma.user.findMany({
        where: {
          consultancyId: params.consultancyId,
          deletedAt: null,
          phone: { not: null },
        },
        select: { phone: true },
      });
      for (const user of users) {
        const phone = normalizePhone(user.phone ?? "");
        if (phone) {
          recipientSet.add(phone);
        }
      }
    }

    if (params.includeStudents) {
      const students = await prisma.student.findMany({
        where: {
          consultancyId: params.consultancyId,
          phone: { not: null },
        },
        select: { phone: true },
      });
      for (const student of students) {
        const phone = normalizePhone(student.phone ?? "");
        if (phone) {
          recipientSet.add(phone);
        }
      }
    }

    if (params.includeLeads) {
      const leads = await prisma.lead.findMany({
        where: {
          consultancyId: params.consultancyId,
          phone: { not: null },
        },
        select: { phone: true },
      });
      for (const lead of leads) {
        const phone = normalizePhone(lead.phone ?? "");
        if (phone) {
          recipientSet.add(phone);
        }
      }
    }

    this.enforceRecipientLimit(recipientSet.size);
    return Array.from(recipientSet);
  }

  private static async dispatchEmails(
    consultancyId: string,
    recipients: string[],
    subject: string,
    message: string,
  ) {
    let sent = 0;
    let failed = 0;
    const failures: Array<{ destination: string; error: string }> = [];

    for (const destination of recipients) {
      try {
        await NotificationService.sendPromotionalEmail(
          consultancyId,
          destination,
          subject,
          message,
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        failures.push({ destination, error: String(error) });
      }
    }

    return {
      sent,
      failed,
      failures: failures.slice(0, 50),
    };
  }

  private static async dispatchSms(
    consultancyId: string,
    recipients: string[],
    message: string,
  ) {
    let sent = 0;
    let failed = 0;
    const failures: Array<{ destination: string; error: string }> = [];

    for (const destination of recipients) {
      try {
        await NotificationService.sendPromotionalSms(
          consultancyId,
          destination,
          message,
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        failures.push({ destination, error: String(error) });
      }
    }

    return {
      sent,
      failed,
      failures: failures.slice(0, 50),
    };
  }

  private static enforceRecipientLimit(count: number) {
    if (count > 1000) {
      throw new AppError(
        400,
        "RECIPIENT_LIMIT_EXCEEDED",
        "Maximum 1000 recipients allowed per request",
      );
    }
  }
}
