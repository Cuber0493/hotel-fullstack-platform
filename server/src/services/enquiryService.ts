import { randomUUID } from 'crypto';
import { dataStore, EnquiryEntity } from '../repositories/dataStore.js';
import { CreateEnquiryInput, UpdateEnquiryStatusInput } from '../schemas/hotelSchemas.js';
import { NotFoundError } from '../errors/AppError.js';
import { logEnquiryEvent } from '../lib/logger.js';
import { EnquiryStatus } from '@prisma/client';

export class EnquiryService {
  async createEnquiry(input: CreateEnquiryInput): Promise<EnquiryEntity> {
    const enquiry: EnquiryEntity = {
      id: `enq-${randomUUID()}`,
      userId: input.userId || null,
      propertyId: input.propertyId,
      name: input.name,
      email: input.email,
      message: input.message,
      status: EnquiryStatus.NEW,
      internalNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.enquiries.unshift(enquiry);

    logEnquiryEvent('created', {
      enquiryId: enquiry.id,
      propertyId: enquiry.propertyId,
      email: enquiry.email,
    });

    return enquiry;
  }

  async listEnquiries(status?: EnquiryStatus): Promise<EnquiryEntity[]> {
    if (status) {
      return dataStore.enquiries.filter((e) => e.status === status);
    }
    return dataStore.enquiries;
  }

  async updateEnquiryStatus(
    enquiryId: string,
    input: UpdateEnquiryStatusInput
  ): Promise<EnquiryEntity> {
    const enquiry = dataStore.enquiries.find((e) => e.id === enquiryId);
    if (!enquiry) {
      throw new NotFoundError(`Enquiry '${enquiryId}' not found`);
    }

    enquiry.status = input.status;
    if (input.internalNotes !== undefined) {
      enquiry.internalNotes = input.internalNotes;
    }
    enquiry.updatedAt = new Date();

    logEnquiryEvent('status_updated', {
      enquiryId: enquiry.id,
      status: enquiry.status,
      email: enquiry.email,
    });

    return enquiry;
  }
}

export const enquiryService = new EnquiryService();
