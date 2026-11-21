import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { CreateEnquiryInput, UpdateEnquiryStatusInput } from '../schemas/hotelSchemas.js';
import { NotFoundError } from '../errors/AppError.js';
import { logEnquiryEvent } from '../lib/logger.js';
import { EnquiryStatus } from '@prisma/client';

export class EnquiryService {
  async createEnquiry(input: CreateEnquiryInput) {
    const enquiry = await prisma.enquiry.create({
      data: {
        id: `enq-${randomUUID()}`,
        userId: input.userId || null,
        propertyId: input.propertyId,
        name: input.name,
        email: input.email,
        message: input.message,
        status: EnquiryStatus.NEW,
        internalNotes: null,
      },
    });

    logEnquiryEvent('created', {
      enquiryId: enquiry.id,
      propertyId: enquiry.propertyId,
      email: enquiry.email,
    });

    return enquiry;
  }

  async listEnquiries(status?: EnquiryStatus) {
    if (status) {
      return prisma.enquiry.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
      });
    }
    return prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateEnquiryStatus(
    enquiryId: string,
    input: UpdateEnquiryStatusInput
  ) {
    const existing = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });
    if (!existing) {
      throw new NotFoundError(`Enquiry '${enquiryId}' not found`);
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        status: input.status,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : undefined,
      },
    });

    logEnquiryEvent('status_updated', {
      enquiryId: updated.id,
      status: updated.status,
      email: updated.email,
    });

    return updated;
  }
}

export const enquiryService = new EnquiryService();
