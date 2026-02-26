import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { Resend } from "resend";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

const resend = new Resend(env.RESEND_API_KEY);

export class NotificationService {
  private static logDevOtp(channel: NotificationChannel, destination: string, purpose: string, otp: string) {
    if (env.NODE_ENV === "development") {
      console.info(`[DEV_OTP] channel=${channel} destination=${destination} purpose=${purpose} otp=${otp}`);
    }
  }

  private static async logResult(params: {
    consultancyId: string;
    channel: NotificationChannel;
    destination: string;
    templateKey: string;
    status: NotificationStatus;
    providerResponse?: unknown;
  }) {
    await prisma.notificationLog.create({
      data: {
        consultancyId: params.consultancyId,
        channel: params.channel,
        destination: params.destination,
        templateKey: params.templateKey,
        providerResponse: (params.providerResponse as object) ?? undefined,
        status: params.status,
      },
    });
  }

  static async sendEmailOtp(
    consultancyId: string,
    destination: string,
    otp: string,
    purpose: string,
  ) {
    this.logDevOtp(NotificationChannel.EMAIL, destination, purpose, otp);

    try {
      const response = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: destination,
        subject: `Consultease OTP: ${purpose}`,
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });

      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: `otp.${purpose}`,
        providerResponse: response,
        status: NotificationStatus.SENT,
      });

      return response;
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: `otp.${purpose}`,
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });

      throw error;
    }
  }

  static async sendSmsOtp(
    consultancyId: string,
    destination: string,
    otp: string,
    purpose: string,
  ) {
    this.logDevOtp(NotificationChannel.SMS, destination, purpose, otp);

    try {
      const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${env.SPARROW_TOKEN}`,
        },
        body: new URLSearchParams({
          from: env.SPARROW_FROM,
          to: destination,
          text: `Consultease OTP (${purpose}): ${otp}`,
        }),
      });

      const payload = await response.json();

      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: `otp.${purpose}`,
        providerResponse: payload,
        status: response.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
      });

      if (!response.ok) {
        throw new Error("Failed to send SMS OTP");
      }

      return payload;
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: `otp.${purpose}`,
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });

      throw error;
    }
  }

  static async sendInviteEmail(
    consultancyId: string,
    destination: string,
    consultancySlug: string,
    token: string,
  ) {
    const inviteLink = `https://app.consultease.com/invite/accept?consultancySlug=${encodeURIComponent(consultancySlug)}&token=${encodeURIComponent(token)}`;
    try {
      const response = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: destination,
        subject: "Consultease Invitation",
        text: `You are invited to Consultease. Accept invitation: ${inviteLink}`,
      });
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: "invite.user",
        providerResponse: response,
        status: NotificationStatus.SENT,
      });
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: "invite.user",
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });
      throw error;
    }
  }

  static async sendInviteSms(
    consultancyId: string,
    destination: string,
    consultancySlug: string,
    token: string,
  ) {
    try {
      const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${env.SPARROW_TOKEN}`,
        },
        body: new URLSearchParams({
          from: env.SPARROW_FROM,
          to: destination,
          text: `Consultease invite token: ${token} (consultancy: ${consultancySlug})`,
        }),
      });
      const payload = await response.json();
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: "invite.user",
        providerResponse: payload,
        status: response.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
      });
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: "invite.user",
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });
      throw error;
    }
  }

  static async sendPromotionalEmail(
    consultancyId: string,
    destination: string,
    subject: string,
    message: string,
  ) {
    try {
      const response = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: destination,
        subject,
        text: message,
      });
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: "marketing.email",
        providerResponse: response,
        status: NotificationStatus.SENT,
      });
      return response;
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.EMAIL,
        destination,
        templateKey: "marketing.email",
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });
      throw error;
    }
  }

  static async sendPromotionalSms(
    consultancyId: string,
    destination: string,
    message: string,
  ) {
    try {
      const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${env.SPARROW_TOKEN}`,
        },
        body: new URLSearchParams({
          from: env.SPARROW_FROM,
          to: destination,
          text: message,
        }),
      });

      const payload = await response.json();
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: "marketing.sms",
        providerResponse: payload,
        status: response.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
      });

      if (!response.ok) {
        throw new Error("Failed to send promotional SMS");
      }

      return payload;
    } catch (error) {
      await this.logResult({
        consultancyId,
        channel: NotificationChannel.SMS,
        destination,
        templateKey: "marketing.sms",
        providerResponse: { error: String(error) },
        status: NotificationStatus.FAILED,
      });
      throw error;
    }
  }
}
