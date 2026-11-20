import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export interface BookingEmailPayload {
  bookingId: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  roomTypeName: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalInr: number;
  specialRequests?: string | null;
}

export interface EnquiryEmailPayload {
  enquiryId: string;
  name: string;
  email: string;
  propertyName?: string;
  message: string;
}

export interface MetricsDigestPayload {
  date: string;
  occupancyRate: number;
  adr: number;
  revpar: number;
  totalRevenueInr: number;
  roomNightsSold: number;
  roomNightsAvailable: number;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = env.NODE_ENV === 'test';
    this.initTransporter();
  }

  private initTransporter() {
    if (this.isTestMode) {
      // In-memory test transporter (captures mail without external network hits)
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      return;
    }

    if (env.RESEND_API_KEY) {
      // Resend SMTP bridge
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: env.RESEND_API_KEY,
        },
      });
    } else {
      // Development fallback: stream JSON or Ethereal
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  /**
   * Dispatches luxury booking confirmation folio to the guest.
   */
  async sendBookingConfirmation(
    payload: BookingEmailPayload
  ): Promise<{ messageId: string; success: boolean }> {
    const subject = `Your Stay is Confirmed: ${payload.bookingCode} | The Bombay Reserve`;
    const html = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #1a1714; color: #f5f2eb; padding: 40px; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 1px solid #b89758; padding-bottom: 24px; margin-bottom: 30px;">
          <h1 style="color: #b89758; letter-spacing: 3px; font-size: 24px; margin: 0; text-transform: uppercase;">The Bombay Reserve</h1>
          <p style="color: #a89e92; font-size: 13px; margin-top: 8px; letter-spacing: 1px;">MUMBAI BOUTIQUE HOTEL COLLECTIVE</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">Dear ${payload.guestName},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #d4cdc5;">
          We are pleased to confirm your reservation at <strong>${payload.propertyName}</strong>. Your sanctuary in the heart of Mumbai awaits your arrival.
        </p>

        <div style="background: #24201b; border: 1px solid #3d352b; border-radius: 6px; padding: 24px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d4cdc5;">
            <tr>
              <td style="padding: 8px 0; color: #b89758;">Booking Reference:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #ffffff;">${payload.bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b89758;">Suite Category:</td>
              <td style="padding: 8px 0; text-align: right;">${payload.roomTypeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b89758;">Check-In:</td>
              <td style="padding: 8px 0; text-align: right;">${payload.checkIn} (14:00)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b89758;">Check-Out:</td>
              <td style="padding: 8px 0; text-align: right;">${payload.checkOut} (11:00)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #b89758;">Duration:</td>
              <td style="padding: 8px 0; text-align: right;">${payload.nights} Night${payload.nights > 1 ? 's' : ''}</td>
            </tr>
            <tr style="border-top: 1px solid #3d352b;">
              <td style="padding: 12px 0 4px 0; font-weight: bold; color: #ffffff;">Total Amount:</td>
              <td style="padding: 12px 0 4px 0; font-weight: bold; text-align: right; color: #b89758; font-size: 16px;">₹${payload.totalInr.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        ${
          payload.specialRequests
            ? `<p style="font-size: 13px; color: #a89e92; font-style: italic;">Special Requests: "${payload.specialRequests}"</p>`
            : ''
        }

        <p style="font-size: 14px; line-height: 1.6; color: #a89e92; margin-top: 30px;">
          Should you require bespoke airport transfers, dietary accommodations, or heritage walking tours, our concierge team is at your command.
        </p>

        <div style="border-top: 1px solid #3d352b; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6b6358; text-align: center;">
          The Bombay Reserve Concierge • Mumbai, India • concierge@bombayreserve.com
        </div>
      </div>
    `;

    try {
      const info = await this.transporter!.sendMail({
        from: `The Bombay Reserve <${env.EMAIL_FROM}>`,
        to: payload.guestEmail,
        subject,
        html,
        text: `Reservation Confirmed: ${payload.bookingCode}\nProperty: ${payload.propertyName}\nCheck-in: ${payload.checkIn}\nCheck-out: ${payload.checkOut}\nTotal: ₹${payload.totalInr}`,
      });

      const messageId = info.messageId || `msg-${Date.now()}`;
      logger.info({
        event: 'email.sent',
        type: 'booking_confirmation',
        bookingCode: payload.bookingCode,
        recipient: payload.guestEmail,
        messageId,
      });

      return { messageId, success: true };
    } catch (err: any) {
      logger.error({
        event: 'email.failed',
        type: 'booking_confirmation',
        bookingCode: payload.bookingCode,
        recipient: payload.guestEmail,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Dispatches new bespoke event enquiry alert to General Manager / Concierge Admin.
   */
  async sendEnquiryNotification(
    payload: EnquiryEmailPayload
  ): Promise<{ messageId: string; success: boolean }> {
    const adminEmail = env.ADMIN_EMAIL || 'admin@bombayreserve.com';
    const subject = `[Action Required] New Bespoke Event Enquiry from ${payload.name} | The Bombay Reserve`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1714; padding: 30px; border: 1px solid #e2ded8; border-radius: 6px;">
        <h2 style="color: #b89758; margin-top: 0;">New Bespoke Event Enquiry</h2>
        <p>A new private gathering or event enquiry has been received and requires triage:</p>

        <div style="background: #f8f6f2; padding: 20px; border-left: 4px solid #b89758; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Client Name:</strong> ${payload.name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Client Email:</strong> <a href="mailto:${payload.email}">${payload.email}</a></p>
          ${payload.propertyName ? `<p style="margin: 0 0 10px 0;"><strong>Target Property:</strong> ${payload.propertyName}</p>` : ''}
          <p style="margin: 0 0 10px 0;"><strong>Enquiry Reference:</strong> ${payload.enquiryId}</p>
          <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
          <p style="margin: 6px 0 0 0; font-style: italic; color: #4a453f;">"${payload.message}"</p>
        </div>

        <p style="font-size: 13px; color: #6b6358;">
          Log in to the Executive Management Portal to mark status as CONTACTED or QUOTED.
        </p>
      </div>
    `;

    try {
      const info = await this.transporter!.sendMail({
        from: `The Bombay Reserve Alerts <${env.EMAIL_FROM}>`,
        to: adminEmail,
        subject,
        html,
        text: `New Enquiry from ${payload.name} (${payload.email}):\n${payload.message}`,
      });

      const messageId = info.messageId || `msg-enq-${Date.now()}`;
      logger.info({
        event: 'email.sent',
        type: 'enquiry_notification',
        enquiryId: payload.enquiryId,
        recipient: adminEmail,
        messageId,
      });

      return { messageId, success: true };
    } catch (err: any) {
      logger.error({
        event: 'email.failed',
        type: 'enquiry_notification',
        enquiryId: payload.enquiryId,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Dispatches nightly executive metrics digest to GM.
   */
  async sendMetricsDigest(
    payload: MetricsDigestPayload
  ): Promise<{ messageId: string; success: boolean }> {
    const adminEmail = env.ADMIN_EMAIL || 'admin@bombayreserve.com';
    const subject = `Nightly Performance Digest: RevPAR ₹${Math.round(payload.revpar).toLocaleString('en-IN')} | The Bombay Reserve`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #d4cdc5; border-radius: 6px;">
        <h2 style="color: #b89758; margin-top: 0;">Nightly Metrics Snapshot: ${payload.date}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0;">Occupancy Rate:</td><td style="font-weight: bold; text-align: right;">${(payload.occupancyRate * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding: 6px 0;">Average Daily Rate (ADR):</td><td style="font-weight: bold; text-align: right;">₹${Math.round(payload.adr).toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding: 6px 0;">RevPAR:</td><td style="font-weight: bold; text-align: right; color: #b89758;">₹${Math.round(payload.revpar).toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding: 6px 0;">Total Revenue:</td><td style="font-weight: bold; text-align: right;">₹${payload.totalRevenueInr.toLocaleString('en-IN')}</td></tr>
          <tr><td style="padding: 6px 0;">Room Nights Sold:</td><td style="font-weight: bold; text-align: right;">${payload.roomNightsSold} / ${payload.roomNightsAvailable}</td></tr>
        </table>
      </div>
    `;

    try {
      const info = await this.transporter!.sendMail({
        from: `The Bombay Reserve Analytics <${env.EMAIL_FROM}>`,
        to: adminEmail,
        subject,
        html,
        text: `Nightly Metrics for ${payload.date}:\nRevPAR: ₹${payload.revpar}\nOccupancy: ${(payload.occupancyRate * 100).toFixed(1)}%\nADR: ₹${payload.adr}`,
      });

      return { messageId: info.messageId || `msg-met-${Date.now()}`, success: true };
    } catch (err: any) {
      logger.error({ event: 'email.failed', type: 'metrics_digest', error: err.message });
      throw err;
    }
  }
}

export const emailService = new EmailService();
