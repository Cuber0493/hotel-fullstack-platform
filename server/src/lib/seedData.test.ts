import { describe, it, expect } from 'vitest';
import { MUMBAI_PROPERTIES } from '../../prisma/seedData.js';

describe('Seed Data Integrity', () => {
  it('contains exactly 14 unique boutique hotel properties in Mumbai', () => {
    expect(MUMBAI_PROPERTIES).toHaveLength(14);
    const slugs = MUMBAI_PROPERTIES.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(14);
  });

  it('all properties have valid neighborhoods and contact details', () => {
    for (const property of MUMBAI_PROPERTIES) {
      expect(property.name).toBeTruthy();
      expect(property.neighborhood).toBeTruthy();
      expect(property.address).toBeTruthy();
      expect(property.description.length).toBeGreaterThan(50);
      expect(property.heroImage).toMatch(/^https:\/\//);
      expect(property.amenities.length).toBeGreaterThanOrEqual(3);
      expect(property.contactPhone).toBeTruthy();
      expect(property.contactEmail).toContain('@bombayreserve.com');
      expect(property.roomTypes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('contains at least 42 total room types across the 14 properties', () => {
    const totalRoomTypes = MUMBAI_PROPERTIES.reduce(
      (sum, p) => sum + p.roomTypes.length,
      0
    );
    expect(totalRoomTypes).toBeGreaterThanOrEqual(42);

    for (const property of MUMBAI_PROPERTIES) {
      for (const rt of property.roomTypes) {
        expect(rt.name).toBeTruthy();
        expect(rt.slug).toBeTruthy();
        expect(rt.basePrice).toBeGreaterThan(5000);
        expect(rt.maxGuests).toBeGreaterThanOrEqual(1);
        expect(rt.roomNumbers.length).toBe(rt.totalInventory);
      }
    }
  });
});
