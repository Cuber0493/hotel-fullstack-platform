export interface PropertySeed {
  slug: string;
  name: string;
  neighborhood: string;
  address: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  contactPhone: string;
  contactEmail: string;
  roomTypes: {
    slug: string;
    name: string;
    description: string;
    basePrice: number;
    maxGuests: number;
    bedCount: number;
    bedType: string;
    roomSizeSqFt: number;
    amenities: string[];
    images: string[];
    totalInventory: number;
    roomNumbers: string[];
  }[];
}

export const MUMBAI_PROPERTIES: PropertySeed[] = [
  {
    slug: 'the-colaba-colonial',
    name: 'The Colaba Colonial',
    neighborhood: 'Colaba, South Mumbai',
    address: '14 B.K. Boman Behram Marg, Apollo Bandar, Colaba, Mumbai 400001',
    description: 'A restored 1912 Victorian-Edwardian mansion steps from the Gateway of India. Featuring Burma teak wood floors, soaring 16-foot vaulted ceilings, brass four-poster beds, and an intimate courtyard conservatory.',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Heritage Courtyard Café', 'Artisanal Breakfast', 'Valet Parking', 'Curated Art Library', 'High-speed Wi-Fi', '24/7 Butler Service'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1401',
    contactEmail: 'colaba@bombayreserve.com',
    roomTypes: [
      {
        slug: 'heritage-grand-suite',
        name: 'Heritage Grand Suite',
        description: 'Expansive private residence with stained-glass bay windows overlooking the leafy courtyard, antique writing bureau, and marble bath with standalone soaking tub.',
        basePrice: 22500,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Grand King Canopy',
        roomSizeSqFt: 620,
        amenities: ['Freestanding Clawfoot Tub', 'Nespresso Atelier', 'Courtyard View', 'Marshall Speaker', 'Organic Cotton Robes'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['101', '102', '103']
      },
      {
        slug: 'victorian-deluxe',
        name: 'Victorian Deluxe Chamber',
        description: 'Elegantly proportioned room with hand-woven silk tapestries, dark oak floors, and bespoke ceramic fittings.',
        basePrice: 15500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 420,
        amenities: ['Walk-in Rain Shower', 'Handcrafted Minibar', 'City View', 'Organic Toiletries'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['201', '202', '203', '204']
      },
      {
        slug: 'colonial-verandah-room',
        name: 'Colonial Verandah Room',
        description: 'Charming retreat opening onto a private colonial arched verandah with cane armchairs and tropical potted palms.',
        basePrice: 18000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 480,
        amenities: ['Private Verandah', 'Garden View', 'Pillow Menu', 'Artisanal Tea Station'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['301', '302', '303']
      }
    ]
  },
  {
    slug: 'marine-drive-bayview',
    name: 'Marine Drive Bayview',
    neighborhood: 'Marine Drive, South Mumbai',
    address: '88 Marine Drive Promenade, Churchgate, Mumbai 400020',
    description: 'An iconic 1930s Art Deco masterpiece positioned directly on the Arabian Sea promenade. Admire the curve of the Queens Necklace from sunset cocktail terraces and sun-drenched minimalist suites.',
    heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Sea-facing Sunset Rooftop', 'Art Deco Cocktail Lounge', '24/7 In-Room Dining', 'Chauffeured Airport Transfers'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1402',
    contactEmail: 'bayview@bombayreserve.com',
    roomTypes: [
      {
        slug: 'queens-necklace-suite',
        name: "Queen's Necklace Panoramic Suite",
        description: 'Corner penthouse with floor-to-ceiling curved glass windows capturing unobstructed panoramic vistas of the Arabian Sea and city skyline lights.',
        basePrice: 32000,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Signature Emperor Bed',
        roomSizeSqFt: 750,
        amenities: ['Panoramic Sea View', 'Private Telescope', 'Champagne Bar', 'Deep Soaking Jacuzzi'],
        images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['501', '502']
      },
      {
        slug: 'sea-breeze-deluxe',
        name: 'Sea Breeze Deluxe',
        description: 'Nautical-inspired Art Deco room with private balcony overlooking the promenade, terrazzo tiles, and polished chrome accents.',
        basePrice: 19500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 460,
        amenities: ['Direct Promenade View', 'Acoustic Soundproofing', 'Rain Shower', 'Espresso Machine'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['301', '302', '303', '304']
      },
      {
        slug: 'deco-classic-room',
        name: 'Deco Classic Room',
        description: 'Chic urban retreat with geometric chevron paneling, king bed with Egyptian cotton linen, and quiet courtyard aspect.',
        basePrice: 14500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 380,
        amenities: ['Smart Climate Control', 'Walk-in Shower', 'Curated Vinyl Collection', 'High-speed Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['201', '202', '203', '204']
      }
    ]
  },
  {
    slug: 'kala-ghoda-art-house',
    name: 'Kala Ghoda Art House',
    neighborhood: 'Kala Ghoda, South Mumbai',
    address: '22 Ropewalk Lane, Kala Ghoda Arts Precinct, Fort, Mumbai 400001',
    description: 'Nestled amidst premier galleries and designer boutiques, this bohemian gallery residence doubles as a rotating exhibition space for contemporary Indian artists.',
    heroImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['In-house Art Curator', 'Espresso & Wine Bar', 'Boutique Gallery Shop', 'Artist Residency Loft'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1403',
    contactEmail: 'kalaghoda@bombayreserve.com',
    roomTypes: [
      {
        slug: 'curators-atelier-loft',
        name: "Curator's Atelier Loft",
        description: 'Duplex creative suite with double-height easel corner, private sculpture collection, skylight, and mezzanine king bedroom.',
        basePrice: 21000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Mezzanine King Bed',
        roomSizeSqFt: 580,
        amenities: ['Original Artwork', 'Skylight Illumination', 'Turntable & Vinyls', 'Artisanal Apothecary Kit'],
        images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['401', '402']
      },
      {
        slug: 'gallery-studio',
        name: 'Gallery Studio Room',
        description: 'Minimalist studio styled in raw plaster, reclaimed teak, and statement lighting, designed for reflective urban respite.',
        basePrice: 13500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 390,
        amenities: ['Custom Sketching Desk', 'Rain Shower', 'Local Artisan Snacks', 'Curated Book Collection'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['301', '302', '303', '304']
      },
      {
        slug: 'ropewalk-cosy-room',
        name: 'Ropewalk Cosy Room',
        description: 'Intimate boutique room with warm ochre tones, brass sconces, and soundproofed windows overlooking historical lanes.',
        basePrice: 10500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 320,
        amenities: ['Walk-in Shower', 'Fast Wi-Fi', 'Pour-over Coffee Kit', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      }
    ]
  },
  {
    slug: 'the-malabar-verandah',
    name: 'The Malabar Verandah',
    neighborhood: 'Malabar Hill, South Mumbai',
    address: '6 Little Gibbs Road, Hanging Gardens Enclave, Malabar Hill, Mumbai 400006',
    description: 'An aristocratic sanctuary enveloped by century-old banyan trees and wild bougainvillea on Mumbai’s most storied hill, commanding glimpses of Back Bay and the governor’s estate.',
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Botanical Glasshouse High Tea', 'Private Lap Pool', 'Ayurvedic Wellness Spa', 'Library of Indian Philosophy'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1404',
    contactEmail: 'malabar@bombayreserve.com',
    roomTypes: [
      {
        slug: 'malabar-presidential-suite',
        name: 'Malabar Verandah Suite',
        description: 'Stately suite with continuous shaded teak verandah, hand-carved rosewood daybeds, and private outdoor marble shower.',
        basePrice: 28000,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Hand-carved Rosewood King',
        roomSizeSqFt: 720,
        amenities: ['Private Garden Verandah', 'Outdoor Rain Shower', 'Ayurvedic Bath Elixirs', 'High Tea Service'],
        images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['101', '102']
      },
      {
        slug: 'botanical-deluxe',
        name: 'Botanical Garden Deluxe',
        description: 'Sunlit garden-level chamber with french doors opening towards rare tropical ferns and lotus ponds.',
        basePrice: 17000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 450,
        amenities: ['Lotus Pond View', 'Freestanding Stone Tub', 'Aromatherapy Diffuser', 'Espresso Bar'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      },
      {
        slug: 'ridge-view-room',
        name: 'Ridge View Chamber',
        description: 'Quiet upper-level sanctuary featuring panoramic tree canopy views and bespoke hand-knotted dhurrie rugs.',
        basePrice: 14000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 360,
        amenities: ['Canopy Views', 'Walk-in Shower', 'Pillow Selection', 'Organic Teas'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['301', '302', '303']
      }
    ]
  },
  {
    slug: 'bandra-bohemian-villa',
    name: 'Bandra Bohemian Villa',
    neighborhood: 'Pali Hill, Bandra West',
    address: '19 Zig Zag Road, Pali Hill, Bandra West, Mumbai 400050',
    description: 'A whimsical 1920s Indo-Portuguese bungalow secluded behind mango groves in celebrity-studded Pali Hill, featuring terracotta roof tiles, hand-painted azulejos, and an open courtyard.',
    heroImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Secret Garden Plunge Pool', 'Farm-to-Table Bistro', 'Yoga & Meditation Pavilion', 'Artisan Gin Bar'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1405',
    contactEmail: 'pali@bombayreserve.com',
    roomTypes: [
      {
        slug: 'pali-master-loft',
        name: 'Pali Hill Rooftop Loft',
        description: 'Romantic timber-beamed loft with open-air terrace, private hammock under frangipani blossoms, and custom copper bathtub.',
        basePrice: 24000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Teak Platform Bed',
        roomSizeSqFt: 600,
        amenities: ['Private Rooftop Terrace', 'Outdoor Copper Tub', 'Bose Soundbar', 'Complimentary Sunset Wine'],
        images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['301', '302']
      },
      {
        slug: 'azulejo-courtyard-room',
        name: 'Azulejo Courtyard Room',
        description: 'Character-rich room lined with authentic hand-glazed blue-and-white tiles, wrought-iron daybed, and French garden doors.',
        basePrice: 16000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 430,
        amenities: ['Direct Courtyard Access', 'Walk-in Rainfall Shower', 'Gourmet French Press', 'Linen Loungewear'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['101', '102', '103', '104']
      },
      {
        slug: 'bohemian-garden-chamber',
        name: 'Bohemian Garden Chamber',
        description: 'Vibrant and peaceful room with artisanal cane furniture, brass lanterns, and views of lush tropical greenery.',
        basePrice: 12500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 360,
        amenities: ['Garden View', 'Herbal Bath Amenities', 'Yoga Mat', 'Organic Minibar'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      }
    ]
  },
  {
    slug: 'bandstand-ocean-mist',
    name: 'Bandstand Ocean Mist',
    neighborhood: 'Bandstand, Bandra West',
    address: '42 Byramjee Jeejeebhoy Road, Bandstand, Bandra West, Mumbai 400050',
    description: 'An architectural cliffside villa overlooking Bandra’s crashing ocean waves and historic Portuguese fort ruins, balancing concrete brutalism with warm walnut and ocean horizons.',
    heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Infinity Edge Ocean Pool', 'Sushi & Robata Lounge', 'Personal Fitness Studio', 'Yacht Charter Concierge'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1406',
    contactEmail: 'bandstand@bombayreserve.com',
    roomTypes: [
      {
        slug: 'oceanfront-horizon-penthouse',
        name: 'Oceanfront Horizon Penthouse',
        description: 'Top-tier duplex suite with double-story glass windows overlooking crashing Arabian Sea waves, cantilevered deck, and jacuzzi.',
        basePrice: 38000,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Super King Floating Bed',
        roomSizeSqFt: 880,
        amenities: ['Cantilevered Ocean Deck', 'Private Heated Jacuzzi', 'Dedicated Butler', 'Bang & Olufsen Sound System'],
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 1,
        roomNumbers: ['601']
      },
      {
        slug: 'coastal-premier-suite',
        name: 'Coastal Premier Sea-View Suite',
        description: 'Spacious sea-view haven with wide glass sliding doors opening to ocean breezes, terrazzo bath, and plush daybed.',
        basePrice: 24500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 540,
        amenities: ['Unobstructed Sea View', 'Freestanding Bath', 'Sunset Balcony', 'Wine Cooler'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['401', '402', '403']
      },
      {
        slug: 'cliffside-deluxe',
        name: 'Cliffside Deluxe Room',
        description: 'Modern sanctuary with minimalist Japanese oak joinery and sound-insulated bay window seating.',
        basePrice: 17500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 410,
        amenities: ['Bay Window Ocean Nook', 'Rain Shower', 'Espresso Station', 'Ultra-fast Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['201', '202', '203', '204']
      }
    ]
  },
  {
    slug: 'juhu-palms-retreat',
    name: 'Juhu Palms Retreat',
    neighborhood: 'Juhu Beach, Mumbai',
    address: '10 Juhu Tara Road, Beach Haven Enclave, Juhu, Mumbai 400049',
    description: 'A serene beachside sanctuary surrounded by swaying coconut palms with direct private sand access to Juhu’s quiet northern beach stretch.',
    heroImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Direct Beach Access', 'Palm Grove Pool', 'Seafood Grill', 'Sunrise Yoga Deck'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1407',
    contactEmail: 'juhu@bombayreserve.com',
    roomTypes: [
      {
        slug: 'sunset-beach-villa-suite',
        name: 'Sunset Beach Villa Suite',
        description: 'Private ground-floor villa suite opening straight onto a lawn leading to the sand, featuring an outdoor monsoon shower.',
        basePrice: 26000,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Four-Poster Teak King',
        roomSizeSqFt: 650,
        amenities: ['Direct Beach Lawn', 'Private Outdoor Shower', 'Sunset Deck', 'Artisanal Coconut Refreshments'],
        images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['101', '102']
      },
      {
        slug: 'palm-terrace-deluxe',
        name: 'Palm Terrace Deluxe',
        description: 'Upper-level suite overlooking a sea of coconut fronds with generous private sun loungers on a wooden terrace.',
        basePrice: 18500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 460,
        amenities: ['Private Sun Terrace', 'Palm Grove Views', 'Marble Bathroom', 'Nespresso Coffee'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['201', '202', '203', '204']
      },
      {
        slug: 'juhu-garden-room',
        name: 'Juhu Garden Room',
        description: 'Cozy coastal getaway fitted in natural rattan, bleached linens, and serene sand tones.',
        basePrice: 13500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 350,
        amenities: ['Garden View', 'Rain Shower', 'Organic Beach Amenities', 'High-speed Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['103', '104', '105', '106']
      }
    ]
  },
  {
    slug: 'versova-coastal-sanctuary',
    name: 'Versova Coastal Sanctuary',
    neighborhood: 'Versova, Mumbai',
    address: '8 Yari Road, Fisherman Village Shoreline, Versova, Andheri West, Mumbai 400061',
    description: 'Rooted in Versova’s vibrant Koli fishing heritage and creative community, this artisanal sanctuary features reclaimed boat wood interiors, breezy rooftop lounges, and sea breeze serenity.',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Koli Seafood Tasting Table', 'Rooftop Sundowner Deck', 'Bicycle Rentals', 'Sunset Creek Kayaking'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1408',
    contactEmail: 'versova@bombayreserve.com',
    roomTypes: [
      {
        slug: 'fishermans-loft-suite',
        name: "Fisherman's Artisan Loft Suite",
        description: 'Characterful suite crafted with recycled dhow timbers, custom macrame hammocks, and an open sun deck watching local boats return at dusk.',
        basePrice: 19000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 520,
        amenities: ['Creek & Ocean View', 'Private Hammock Deck', 'Artisanal Gin Bar', 'Organic Linens'],
        images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['301', '302']
      },
      {
        slug: 'driftwood-deluxe',
        name: 'Driftwood Deluxe Room',
        description: 'Airy sanctuary finished in bleached wood, marine brass fixtures, and woven jute carpeting.',
        basePrice: 13000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 380,
        amenities: ['Rain Shower', 'Local Coastal Snacks', 'French Press Station', 'Bluetooth Speaker'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      },
      {
        slug: 'coastal-cosy-studio',
        name: 'Coastal Cosy Studio',
        description: 'Compact yet curated room perfect for creative retreats and peaceful weekend getaways.',
        basePrice: 9500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 300,
        amenities: ['Walk-in Shower', 'Wi-Fi 6', 'Smart Screen', 'Organic Toiletries'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['101', '102', '103']
      }
    ]
  },
  {
    slug: 'worli-sea-face-glasshouse',
    name: 'Worli Sea Face Glasshouse',
    neighborhood: 'Worli Sea Face, Mumbai',
    address: '54 Khan Abdul Gaffar Khan Road, Worli Sea Face, Mumbai 400030',
    description: 'An avant-garde glass pavilion offering dramatic upfront vistas of the Bandra-Worli Sea Link illuminated against twilight waters, featuring Italian marble and contemporary sculpture.',
    heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Sea Link Viewing Lounge', 'Temperature-controlled Pool', 'Sommelier Wine Cellar', 'Private Boardroom'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1409',
    contactEmail: 'worli@bombayreserve.com',
    roomTypes: [
      {
        slug: 'sea-link-vista-suite',
        name: 'Sea Link Panoramic Vista Suite',
        description: 'Corner architectural suite with a 180-degree view of the iconic bridge cables and glowing bay waters.',
        basePrice: 29500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Signature King Bed',
        roomSizeSqFt: 710,
        amenities: ['Direct Sea Link View', 'Motorized Blackout Blinds', 'Marble Soaking Tub', 'Plein Air Terrace'],
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['701', '702']
      },
      {
        slug: 'glasshouse-executive-room',
        name: 'Glasshouse Executive Room',
        description: 'Sleek luxury chamber with floor-to-ceiling soundproof glass, ergonomic work desk, and rainfall shower.',
        basePrice: 18000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 440,
        amenities: ['Sea View', 'Executive Desk', 'Nespresso Atelier', 'Smart Lighting'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['501', '502', '503']
      },
      {
        slug: 'worli-urban-chamber',
        name: 'Worli Urban Chamber',
        description: 'Modern sophisticated room overlooking Worli’s high-energy cityscape with plush bedding and high-spec tech.',
        basePrice: 14000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 360,
        amenities: ['City Skyline View', 'Rain Shower', 'Curated Minibar', 'Acoustic Glass'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['301', '302', '303', '304']
      }
    ]
  },
  {
    slug: 'powai-lake-pavilions',
    name: 'Powai Lake Pavilions',
    neighborhood: 'Powai, Mumbai',
    address: '16 Central Avenue, Hiranandani Enclave, Powai, Mumbai 400076',
    description: 'Hidden amid lush foliage on the quiet perimeter of Powai Lake, this Nordic-inspired timber-and-slate lodge brings Scandinavian calm to Mumbai’s tech corridor.',
    heroImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Lakefront Nordic Sauna', 'Heated Saltwater Pool', 'Artisan Bakery & Roastery', 'EV Charging Hub'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1410',
    contactEmail: 'powai@bombayreserve.com',
    roomTypes: [
      {
        slug: 'lakefront-oasis-suite',
        name: 'Lakefront Oasis Suite',
        description: 'Tranquil pavilion with sliding glass opening towards calm lake waters, cedarwood sauna shower, and private fire bowl deck.',
        basePrice: 21500,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Scandinavian King Bed',
        roomSizeSqFt: 620,
        amenities: ['Direct Lake View', 'Private Cedar Sauna', 'Fireplace Nook', 'Espresso Machine'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['101', '102']
      },
      {
        slug: 'forestview-studio',
        name: 'Forestview Studio Room',
        description: 'Warm oak studio overlooking adjacent nature trails with ergonomic writing desk and rainfall shower.',
        basePrice: 14500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 410,
        amenities: ['Greenery View', 'Ergonomic Desk', 'Rain Shower', 'Organic Tea Selection'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['201', '202', '203', '204']
      },
      {
        slug: 'powai-cosy-cabin-room',
        name: 'Powai Cosy Cabin Room',
        description: 'Compact cabin-inspired luxury room in muted grey and timber accents, offering deep relaxation.',
        basePrice: 11000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 340,
        amenities: ['Walk-in Shower', 'Fast Wi-Fi', 'Smart TV', 'Herbal Tea Station'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['301', '302', '303', '304']
      }
    ]
  },
  {
    slug: 'bkc-executive-boutique',
    name: 'BKC Executive Boutique',
    neighborhood: 'Bandra Kurla Complex (BKC), Mumbai',
    address: 'G-Block, Plot C-22, Bandra Kurla Complex, Mumbai 400051',
    description: 'An oasis of refined discretion in Mumbai’s bustling financial capital. Tailored for corporate executives and connoisseurs, combining Japanese minimalist aesthetics with whisper-quiet privacy.',
    heroImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Whisky Library & Cigar Terrace', 'Express Suit Pressing', 'Private Video-Conferencing Suites', 'Chauffeured Maybach Fleet'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1411',
    contactEmail: 'bkc@bombayreserve.com',
    roomTypes: [
      {
        slug: 'executive-corner-suite',
        name: 'Executive Corner Suite',
        description: 'Executive corner residence featuring integrated Herman Miller ergonomic workspace, walk-in dressing room, and automated mood lighting.',
        basePrice: 25000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Executive King Bed',
        roomSizeSqFt: 600,
        amenities: ['Corner City Views', 'Herman Miller Workstation', 'Dressing Room', 'Nespresso Atelier'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['801', '802', '803']
      },
      {
        slug: 'smart-deluxe-room',
        name: 'Smart Deluxe Room',
        description: 'State-of-the-art room with seamless iPad environmental controls, steam shower, and blackout acoustic glass.',
        basePrice: 17000,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 420,
        amenities: ['Smart Room Automation', 'Steam Shower', 'Ergonomic Desk', 'High-speed Fiber Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['601', '602', '603', '604']
      },
      {
        slug: 'minimalist-business-pod',
        name: 'Minimalist Business Chamber',
        description: 'Hyper-efficient Japanese-inspired luxury pod room with custom storage, premium bedding, and sound isolation.',
        basePrice: 13000,
        maxGuests: 1,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 320,
        amenities: ['Sound Isolation', 'Work Nook', 'Rain Shower', 'Espresso Pods'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 4,
        roomNumbers: ['501', '502', '503', '504']
      }
    ]
  },
  {
    slug: 'fort-heritage-chambers',
    name: 'Fort Heritage Chambers',
    neighborhood: 'Fort Historic District, South Mumbai',
    address: '11 Horniman Circle, Near Asiatic Society, Fort, Mumbai 400001',
    description: 'Housed within a majestic 19th-century Neo-Classical colonnade facing Horniman Circle Gardens. Soaring stone archways, historic iron cage elevator, and refined mahogany libraries.',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Governor’s Tea Salon', 'Historic Archive Library', 'Private Concierge', 'Valet Parking'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1412',
    contactEmail: 'fort@bombayreserve.com',
    roomTypes: [
      {
        slug: 'governors-vault-suite',
        name: "Governor's Vault Suite",
        description: 'Grand historical suite built around restored iron bank vault doors, stone arches, and bespoke chesterfield leather couches.',
        basePrice: 23500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Antique King Bed',
        roomSizeSqFt: 630,
        amenities: ['Stone Archways', 'Chesterfield Lounge', 'Antique Soaking Tub', 'Heritage Tea Selection'],
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['201', '202']
      },
      {
        slug: 'horniman-circle-deluxe',
        name: 'Horniman Circle Deluxe Room',
        description: 'Stately room with high arched windows looking over the garden piazza, dark teak floors, and brass fittings.',
        basePrice: 16500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 430,
        amenities: ['Piazza Garden Views', 'Rainfall Shower', 'Artisanal Coffee Bar', 'Pillow Menu'],
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['301', '302', '303']
      },
      {
        slug: 'colonial-chambers-room',
        name: 'Colonial Chambers Room',
        description: 'Classic heritage room offering tranquility with warm amber lighting and woven wool drapes.',
        basePrice: 12500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 350,
        amenities: ['Walk-in Shower', 'Wi-Fi', 'Smart TV', 'Organic Bath Products'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['401', '402', '403']
      }
    ]
  },
  {
    slug: 'dadar-parsi-haven',
    name: 'Dadar Parsi Haven',
    neighborhood: 'Pali/Parsi Colony, Dadar, Central Mumbai',
    address: '5 Hindu Colony / Mancherji Joshi Road, Dadar East, Mumbai 400014',
    description: 'Immersed in the leafy quietude of Dadar Parsi Colony—Mumbai’s largest planned green garden quarter. Art Deco facades, mosaic tiled balconies, and nostalgic homemade Parsi afternoon teas.',
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Traditional Parsi Chai & Snacks', 'Heritage Walking Tours', 'Banyan Tree Garden Courtyard', 'Boutique Library'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1413',
    contactEmail: 'dadar@bombayreserve.com',
    roomTypes: [
      {
        slug: 'deco-garden-suite',
        name: 'Deco Garden Suite',
        description: 'Sun-dappled suite opening into private leafy courtyard with vintage mosaic planter pots, cane loungers, and brass ceiling fans.',
        basePrice: 18500,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Carved Teak King Bed',
        roomSizeSqFt: 550,
        amenities: ['Private Garden Balcony', 'Vintage Mosaic Details', 'Rain Shower', 'Traditional Chai Kit'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['101', '102']
      },
      {
        slug: 'heritage-balcony-room',
        name: 'Heritage Balcony Room',
        description: 'Art Deco bedroom with semi-circular balcony overlooking tree-lined avenues, terrazzo floors, and cozy reading nook.',
        basePrice: 13500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 390,
        amenities: ['Leafy Street Balcony', 'Rain Shower', 'Local Bakery Treats', 'Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      },
      {
        slug: 'parsi-colony-cosy-room',
        name: 'Parsi Colony Cosy Room',
        description: 'Charming room featuring pastel tones, nostalgic family portraiture, and quiet garden atmosphere.',
        basePrice: 9500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 310,
        amenities: ['Walk-in Shower', 'Fast Wi-Fi', 'Pour-over Coffee', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['301', '302', '303']
      }
    ]
  },
  {
    slug: 'girgaon-sunset-mansion',
    name: 'Girgaon Sunset Mansion',
    neighborhood: 'Girgaon Chowpatty, South Mumbai',
    address: '29 Chowpatty Seaface, Near Walkeshwar Road, Girgaon, Mumbai 400007',
    description: 'Perched along the historic curve of Girgaon Chowpatty where the city meets sunset waves. Vintage brass balconies, Gujarati-Maharashtrian heritage woodwork, and lively promenade culture.',
    heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'
    ],
    amenities: ['Sunset Tea Terraces', 'Heritage Vegetarian Tasting Menu', 'Promenade Bicycles', 'Concierge Service'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    contactPhone: '+91 22 6900 1414',
    contactEmail: 'girgaon@bombayreserve.com',
    roomTypes: [
      {
        slug: 'sunset-promenade-suite',
        name: 'Sunset Promenade Suite',
        description: 'Spacious sea-facing suite with ornamental brass jhoola (swing), antique armoires, and direct sunset vistas over Chowpatty bay.',
        basePrice: 20000,
        maxGuests: 3,
        bedCount: 1,
        bedType: 'Grand King Bed',
        roomSizeSqFt: 580,
        amenities: ['Panoramic Bay View', 'Traditional Indoor Swing', 'Marble Soaking Tub', 'Sunset Tea Ceremony'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 2,
        roomNumbers: ['401', '402']
      },
      {
        slug: 'chowpatty-deluxe',
        name: 'Chowpatty Bay Deluxe Room',
        description: 'Warm timber-paneled room capturing salty ocean breezes, bespoke brass lamps, and king bed.',
        basePrice: 14500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'King Bed',
        roomSizeSqFt: 410,
        amenities: ['Sea View', 'Walk-in Rain Shower', 'Handcrafted Ceramic Teaware', 'Wi-Fi'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['301', '302', '303']
      },
      {
        slug: 'girgaon-heritage-room',
        name: 'Girgaon Heritage Chamber',
        description: 'Intimate and quiet room with carved wood details, handloom textiles, and courtyard tranquility.',
        basePrice: 10500,
        maxGuests: 2,
        bedCount: 1,
        bedType: 'Queen Bed',
        roomSizeSqFt: 330,
        amenities: ['Courtyard View', 'Rain Shower', 'Local Treats', 'Smart TV'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        totalInventory: 3,
        roomNumbers: ['201', '202', '203']
      }
    ]
  }
];
