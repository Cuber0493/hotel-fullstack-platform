import path from 'path';
import { fileURLToPath } from 'url';
import { writeCsvFile } from '../utils/csvUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAW_DIR = path.resolve(__dirname, '../../data/raw');

// 14 Mumbai Boutique Properties
const PROPERTIES_DATA = [
  {
    id: 'prop-colaba-colonial',
    name: 'The Colaba Colonial',
    city: 'Mumbai',
    address: '14 B.K. Boman Behram Marg, Apollo Bandar, Colaba, Mumbai 400001',
    description: 'A restored 19th-century Victorian manor boasting Burma teak rafters and heritage arches.',
    amenities: 'Victorian Tearoom;Heritage Courtyard;Butler Service;Vintage Car Transfers;Library Lounge',
    imageUrls: 'https://images.unsplash.com/photo-1566073771259-6a8506099945;https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    roomTypes: ['Heritage Grand Suite', 'Victorian Deluxe', 'Deluxe King'],
  },
  {
    id: 'prop-marine-drive-bayview',
    name: 'Marine Drive Bayview',
    city: 'Mumbai',
    address: '118 Marine Drive, Chowpatty, Mumbai 400020',
    description: 'Art Deco seaside glamour overlooking the glittering Queen\'s Necklace curve.',
    amenities: 'Arabian Sea Panorama;Art Deco Bar;Sunset Deck;Valet Parking;Rooftop Telescopes',
    imageUrls: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb;https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9',
    roomTypes: ["Queen's Necklace Suite", 'Sea Breeze Room', 'Standard Queen'],
  },
  {
    id: 'prop-kala-ghoda-art-house',
    name: 'Kala Ghoda Art House',
    city: 'Mumbai',
    address: '22 Ropewalk Lane, Kala Ghoda Arts Precinct, Fort, Mumbai 400001',
    description: 'An avant-garde residential sanctuary embedded within Mumbai\'s premier gallery district.',
    amenities: 'Curated Art Gallery;Artisan Espresso Bar;Sculpture Courtyard;Private Print Library',
    imageUrls: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461;https://images.unsplash.com/photo-1590490360182-c33d57733427',
    roomTypes: ['Artist Studio Suite', 'Gallery Loft', 'Executive Suite'],
  },
  {
    id: 'prop-malabar-verandah',
    name: 'The Malabar Verandah',
    city: 'Mumbai',
    address: '8 Ridge Road, Walkeshwar, Malabar Hill, Mumbai 400006',
    description: 'An aristocratic hill retreat surrounded by ancient banyan groves and Arabian sea breezes.',
    amenities: 'Botanical Gardens;Ayurvedic Spa;Sunset Verandah;Private Chef;High Tea Pavilion',
    imageUrls: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4;https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
    roomTypes: ['Garden Pavilion', 'Malabar Verandah Suite', 'Deluxe King'],
  },
  {
    id: 'prop-bandra-bohemian-villa',
    name: 'Bandra Bohemian Villa',
    city: 'Mumbai',
    address: '17 Chuim Village Road, Pali Hill, Bandra West, Mumbai 400050',
    description: 'An eclectic Portuguese-Goan villa framed by bougainvillea in historic Bandra village.',
    amenities: 'Rooftop Vinyl Den;Organic Garden Bistro;Courtyard Plunge Pool;Bespoke Cocktail Bar',
    imageUrls: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6;https://images.unsplash.com/photo-1564501049412-61c2a3083791',
    roomTypes: ['Pali Hill Loft', 'Portuguese Courtyard Room', 'Standard Queen'],
  },
  {
    id: 'prop-bandstand-ocean-mist',
    name: 'Bandstand Ocean Mist',
    city: 'Mumbai',
    address: '42 Byramjee Jeejeebhoy Road, Bandstand, Bandra West, Mumbai 400050',
    description: 'Modern seaside luxury perched high above the crashing waves of Bandra promontory.',
    amenities: 'Cliffside Infinity Edge;Oceanfront Sunken Deck;Private Helipad Access;Champagne Lounge',
    imageUrls: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750;https://images.unsplash.com/photo-1618773928121-c32242e63f39',
    roomTypes: ['Horizon Penthouse', 'Coastal Premier Room', 'Executive Suite'],
  },
  {
    id: 'prop-juhu-palms-retreat',
    name: 'Juhu Palms Retreat',
    city: 'Mumbai',
    address: '39 Juhu Tara Road, Juhu Beach, Mumbai 400049',
    description: 'A beachfront sanctuary featuring whispering palm fronds and private beach access.',
    amenities: 'Private Beach Boardwalk;Seaside Cabanas;Open-air Yoga Pavilion;Seafood Grill',
    imageUrls: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d;https://images.unsplash.com/photo-1584132967334-10e028bd69f7',
    roomTypes: ['Sunset Beach Suite', 'Palm Terrace Deluxe', 'Deluxe King'],
  },
  {
    id: 'prop-versova-coastal-sanctuary',
    name: 'Versova Coastal Sanctuary',
    city: 'Mumbai',
    address: '77 Yari Road, Versova Fishermans Colony, Andheri West, Mumbai 400061',
    description: 'An artisanal sanctuary constructed with weathered driftwood, brass, and terracotta.',
    amenities: 'Rooftop Stargazing Lounge;Clay Oven Pizzeria;Artisanal Pottery Studio;Sea Kayaks',
    imageUrls: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae;https://images.unsplash.com/photo-1540541338287-41700207dee6',
    roomTypes: ["Fisherman's Loft", 'Driftwood Studio', 'Standard Queen'],
  },
  {
    id: 'prop-worli-seaface-glasshouse',
    name: 'Worli Sea Face Glasshouse',
    city: 'Mumbai',
    address: '88 Worli Sea Face Promenade, Worli, Mumbai 400018',
    description: 'Sleek architectural glass pavilion framing panoramic vistas of the Bandra-Worli Sea Link.',
    amenities: 'Sea Link View Terraces;Heated Hydrotherapy Pool;Japanese Robata Grill;Boardroom',
    imageUrls: 'https://images.unsplash.com/photo-1582719508461-905c673771fd;https://images.unsplash.com/photo-1566665797739-1674de7a421a',
    roomTypes: ['Sea Link Vista Suite', 'Executive Skylight', 'Presidential Suite'],
  },
  {
    id: 'prop-powai-lake-pavilions',
    name: 'Powai Lake Pavilions',
    city: 'Mumbai',
    address: '15 Hiranandani Gardens Lake Boulevard, Powai, Mumbai 400076',
    description: 'Scandinavian minimalist pavilions nestling along the quiet waters of tranquil Powai Lake.',
    amenities: 'Lakeside Jogging Trail;Nordic Sauna;Botanical Herb Garden;Quiet Coworking Atelier',
    imageUrls: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c;https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
    roomTypes: ['Lakeview Oasis', 'Forestview Studio', 'Executive Suite'],
  },
  {
    id: 'prop-bkc-executive-boutique',
    name: 'BKC Executive Boutique',
    city: 'Mumbai',
    address: 'Plot C-59, G Block, Bandra Kurla Complex, Mumbai 400051',
    description: 'Ultra-modern executive suites engineered for business luminaries and international diplomats.',
    amenities: '24/7 Concierge Terminal;Private Whiskey Vault;Soundproof Sleep Pods;Limousine Service',
    imageUrls: 'https://images.unsplash.com/photo-1566073771259-6a8506099945;https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
    roomTypes: ['Executive Corner Suite', 'Minimalist Pod Deluxe', 'Deluxe King'],
  },
  {
    id: 'prop-fort-heritage-chambers',
    name: 'Fort Heritage Chambers',
    city: 'Mumbai',
    address: '5 Mint Road, Ballard Estate, Fort, Mumbai 400001',
    description: 'Neo-Gothic heritage chambers with vaulted stone archways and handcrafted brass fittings.',
    amenities: 'Vaulted Wine Cellar;Gentlemen\'s Cigar Room;Handcrafted Library;Brass Plunge Bath',
    imageUrls: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461;https://images.unsplash.com/photo-1590490360182-c33d57733427',
    roomTypes: ["Governor's Suite", 'Vault Room', 'Standard Queen'],
  },
  {
    id: 'prop-dadar-parsi-haven',
    name: 'Dadar Parsi Haven',
    city: 'Mumbai',
    address: '9 Mancherji Joshi Road, Parsi Colony, Dadar, Mumbai 400014',
    description: 'Art Deco residential oasis surrounded by heritage leafy avenues and heritage verandahs.',
    amenities: 'Heirloom Recipe Cafe;Banyan Courtyard;Reading Sunrooms;Vintage Bicycle Fleet',
    imageUrls: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4;https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
    roomTypes: ['Heritage Balcony Room', 'Deco Garden Suite', 'Deluxe King'],
  },
  {
    id: 'prop-girgaon-sunset-mansion',
    name: 'Girgaon Sunset Mansion',
    city: 'Mumbai',
    address: '29 Pandita Ramabai Marg, Chowpatty, Girgaon, Mumbai 400007',
    description: 'Coastal vintage mansion with wooden shutters welcoming amber sunsets across the bay.',
    amenities: 'Rooftop Sunset Terraces;Chai & Sherbet Bar;Classical Sitar Evenings;Beach Boardwalk',
    imageUrls: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750;https://images.unsplash.com/photo-1618773928121-c32242e63f39',
    roomTypes: ['Sunset Promenade Suite', 'Coastal Studio', 'Executive Suite'],
  },
];

// Room type alias variations deliberately injected
const ROOM_TYPE_VARIATIONS: Record<string, string[]> = {
  'Deluxe King': ['Deluxe King', 'DLX King', 'King Deluxe Room', 'Deluxe King Bed', 'dlx king room'],
  'Standard Queen': ['Standard Queen', 'STD Queen', 'Classic Queen', 'Queen Standard Room', 'std queen room'],
  'Executive Suite': ['Executive Suite', 'Exec Ste', 'Exec Suite', 'Suite - Executive', 'Executive Club Suite'],
  'Presidential Suite': ['Presidential Suite', 'Pres Suite', 'Royal Presidential Suite'],
  'Heritage Grand Suite': ['Heritage Grand Suite', 'Heritage Grand Ste'],
  'Victorian Deluxe': ['Victorian Deluxe', 'Victorian DLX'],
  "Queen's Necklace Suite": ["Queen's Necklace Suite", 'Queens Necklace Suite', 'Bay View Suite'],
  'Sea Breeze Room': ['Sea Breeze Room', 'Sea Breeze Rm'],
  'Artist Studio Suite': ['Artist Studio Suite', 'Artist Studio Ste'],
  'Gallery Loft': ['Gallery Loft'],
  'Garden Pavilion': ['Garden Pavilion'],
  'Malabar Verandah Suite': ['Malabar Verandah Suite'],
  'Pali Hill Loft': ['Pali Hill Loft'],
  'Portuguese Courtyard Room': ['Portuguese Courtyard Room'],
  'Horizon Penthouse': ['Horizon Penthouse'],
  'Coastal Premier Room': ['Coastal Premier Room'],
  'Sunset Beach Suite': ['Sunset Beach Suite'],
  'Palm Terrace Deluxe': ['Palm Terrace Deluxe'],
  "Fisherman's Loft": ["Fisherman's Loft", 'Fishermans Loft'],
  'Driftwood Studio': ['Driftwood Studio'],
  'Sea Link Vista Suite': ['Sea Link Vista Suite'],
  'Executive Skylight': ['Executive Skylight'],
  'Lakeview Oasis': ['Lakeview Oasis'],
  'Forestview Studio': ['Forestview Studio'],
  'Executive Corner Suite': ['Executive Corner Suite'],
  'Minimalist Pod Deluxe': ['Minimalist Pod Deluxe'],
  "Governor's Suite": ["Governor's Suite", 'Governors Suite'],
  'Vault Room': ['Vault Room'],
  'Heritage Balcony Room': ['Heritage Balcony Room'],
  'Deco Garden Suite': ['Deco Garden Suite'],
  'Sunset Promenade Suite': ['Sunset Promenade Suite'],
  'Coastal Studio': ['Coastal Studio'],
};

// First names and last names for realistic Mumbai guest simulation
const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Natasha', 'Aditya', 'Sneha',
  'Kabir', 'Tara', 'Arjun', 'Meera', 'Dev', 'Kavita', 'Siddharth', 'Zoya',
  'Alexander', 'Sophia', 'David', 'Emma', 'Hiroshi', 'Chen', 'Zara', 'Rahul'
];
const LAST_NAMES = [
  'Sharma', 'Mehta', 'Singhania', 'Kapoor', 'Deshmukh', 'Poonawalla', 'Godrej',
  'Merchant', 'Wadia', 'Tata', 'Ambani', 'Bhatia', 'Chopra', 'Nair', 'D\'Souza',
  'Smith', 'Johnson', 'Müller', 'Dubois', 'Tanaka', 'Patel', 'Fernandes'
];

export async function generateRawCsvs() {
  console.log('Generating raw datasets in /server/data/raw/...');

  // 1. Properties CSV
  const propertiesRows = PROPERTIES_DATA.map((p) => ({
    id: p.id,
    name: p.name,
    city: p.city,
    address: p.address,
    description: p.description,
    amenities: p.amenities,
    imageUrls: p.imageUrls,
  }));

  // 2. Rooms CSV (6 rooms per property = 84 rooms)
  const roomsRows: Record<string, string>[] = [];
  PROPERTIES_DATA.forEach((p) => {
    p.roomTypes.forEach((canonicalRt, rtIndex) => {
      const aliasOptions = ROOM_TYPE_VARIATIONS[canonicalRt] || [canonicalRt];
      // 2 rooms per room type
      for (let r = 1; r <= 2; r++) {
        const floor = rtIndex + 1;
        const roomNumber = `${floor}0${r}`;
        const rawAlias = aliasOptions[r % aliasOptions.length];
        const baseRate = 8500 + rtIndex * 5000;

        roomsRows.push({
          id: `room-${p.id.replace('prop-', '')}-${roomNumber}`,
          propertyId: p.id,
          roomType: rawAlias,
          roomNumber,
          status: 'AVAILABLE',
          baseRate: String(baseRate),
        });
      }
    });
  });

  // 3. Bookings CSV (~3,050 rows with deliberately injected mess)
  const bookingsRows: Record<string, string>[] = [];
  const TOTAL_BOOKINGS = 3050;
  const startDate = new Date(2026, 0, 1).getTime(); // Jan 1, 2026
  const endDate = new Date(2026, 11, 31).getTime(); // Dec 31, 2026

  for (let i = 1; i <= TOTAL_BOOKINGS; i++) {
    const bookingCode = `TBR-BOM-${100000 + i}`;
    const property = PROPERTIES_DATA[i % PROPERTIES_DATA.length];
    const room = roomsRows.find((r) => r.propertyId === property.id)!;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / 3) % LAST_NAMES.length];
    const guestName = `${firstName} ${lastName}`;

    // Date computation
    const randomTime = startDate + Math.random() * (endDate - startDate);
    const checkInDate = new Date(randomTime);
    const nights = 1 + (i % 6); // 1 to 6 nights
    let checkOutDate = new Date(checkInDate.getTime() + nights * 24 * 60 * 60 * 1000);

    const inStr = checkInDate.toISOString().split('T')[0];
    let outStr = checkOutDate.toISOString().split('T')[0];

    // Deliberate Injected Mess 1: Inverted check-in / check-out dates
    if (i % 25 === 0) {
      // Plausible typo: Swap check-in and check-out (checkOut is 1-5 days before checkIn)
      const tmp = inStr;
      // inStr stays outStr, outStr becomes tmp
      outStr = tmp; // Now checkOut is earlier than checkIn
    } else if (i % 120 === 0) {
      // Impossible invalid date range: same-day or 0 nights
      outStr = inStr;
    }

    // Deliberate Injected Mess 2: Mixed Currencies (USD vs INR)
    const baseInr = 9500 + (i % 15) * 1200;
    let rateStr = `₹${baseInr}`;
    if (i % 7 === 0) {
      // Quoted in USD
      const usdAmount = Math.round((baseInr / 86.5) * 100) / 100;
      if (i % 14 === 0) {
        rateStr = `$${usdAmount}`;
      } else {
        rateStr = `${usdAmount} USD`;
      }
    } else if (i % 5 === 0) {
      // Quoted with INR suffix
      rateStr = `${baseInr} INR`;
    } else if (i % 3 === 0) {
      // Bare number
      rateStr = String(baseInr);
    }

    // Deliberate Injected Mess 3: Missing or Malformed Guest Email
    let guestEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@example.com`;
    if (i % 45 === 0) {
      // Completely empty email
      guestEmail = '';
    } else if (i % 70 === 0) {
      // Malformed email
      guestEmail = 'not-a-valid-email';
    }

    // Deliberate Injected Mess 4: Duplicate Bookings
    let finalBookingCode = bookingCode;
    if (i % 60 === 0 && i > 60) {
      // Reuse an earlier booking code to create an intentional duplicate
      finalBookingCode = `TBR-BOM-${100000 + (i - 10)}`;
    }

    const guests = 1 + (i % 3);
    const statuses = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
    const status = statuses[i % statuses.length];

    bookingsRows.push({
      id: `bk-raw-${i}`,
      bookingCode: finalBookingCode,
      propertyId: property.id,
      roomNumber: room.roomNumber,
      guestName,
      guestEmail,
      guestPhone: `+91 98200 ${String(10000 + (i % 90000)).padStart(5, '0')}`,
      checkIn: inStr,
      checkOut: outStr,
      guests: String(guests),
      rate: rateStr,
      status,
      specialRequests: i % 4 === 0 ? 'Late check-in requested' : '',
    });
  }

  // 4. Reviews CSV (~950 rows with deliberate out-of-range ratings)
  const reviewsRows: Record<string, string>[] = [];
  const REVIEW_COMMENTS = [
    'An extraordinary heritage experience. The courtyard breakfast was divine.',
    'Breathtaking views of the Arabian Sea and impeccable butler hospitality.',
    'Charming Art Deco details, peaceful colonial ambiance, and wonderful service.',
    'Spacious suite with high ceilings. The vintage library was a delight.',
    'Lovely property in the heart of Mumbai. Will certainly return on my next visit.',
  ];

  for (let j = 1; j <= 950; j++) {
    const booking = bookingsRows[j * 3];
    let rating = 3 + (j % 3); // 3, 4, or 5 (normal)

    // Deliberate Injected Mess 5: Out of range ratings
    if (j % 20 === 0) {
      rating = 6; // Above 5
    } else if (j % 35 === 0) {
      rating = 0; // Below 1
    } else if (j % 60 === 0) {
      rating = 10; // 10-point scale mistake
    } else if (j % 80 === 0) {
      rating = -1; // Negative
    }

    reviewsRows.push({
      id: `rev-raw-${j}`,
      bookingId: booking ? booking.id : `bk-raw-${j}`,
      propertyId: booking ? booking.propertyId : 'prop-colaba-colonial',
      guestName: booking ? booking.guestName : 'Guest Reviewer',
      rating: String(rating),
      comment: REVIEW_COMMENTS[j % REVIEW_COMMENTS.length],
      createdAt: '2026-09-15',
    });
  }

  // Write all 4 CSV files
  await writeCsvFile(path.join(RAW_DIR, 'properties.csv'), propertiesRows);
  await writeCsvFile(path.join(RAW_DIR, 'rooms.csv'), roomsRows);
  await writeCsvFile(path.join(RAW_DIR, 'bookings.csv'), bookingsRows);
  await writeCsvFile(path.join(RAW_DIR, 'reviews.csv'), reviewsRows);

  console.log(`Successfully generated raw datasets in ${RAW_DIR}:`);
  console.log(`- properties.csv: ${propertiesRows.length} rows`);
  console.log(`- rooms.csv:      ${roomsRows.length} rows`);
  console.log(`- bookings.csv:   ${bookingsRows.length} rows`);
  console.log(`- reviews.csv:    ${reviewsRows.length} rows`);
}

// Execute if run directly from terminal
if (process.argv[1] && process.argv[1].endsWith('generateRawData.ts')) {
  generateRawCsvs().catch((err) => {
    console.error('Failed to generate raw CSV data:', err);
    process.exit(1);
  });
}
