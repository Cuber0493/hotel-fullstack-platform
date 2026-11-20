# Database ERD & Schema Catalog

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    USER ||--o{ ENQUIRY : submits
    PROPERTY ||--|{ ROOM_TYPE : contains
    PROPERTY ||--o{ ENQUIRY : targets
    ROOM_TYPE ||--|{ ROOM : instances
    ROOM ||--o{ BOOKING_ITEM : allocated
    BOOKING ||--|{ BOOKING_ITEM : has

    USER {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string phone
        string role "GUEST | STAFF | ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    PROPERTY {
        string id PK
        string slug UK
        string name
        string neighborhood
        string address
        string description
        string heroImage
        string[] galleryImages
        string[] amenities
        string checkInTime
        string checkOutTime
        string contactPhone
        string contactEmail
        datetime createdAt
    }

    ROOM_TYPE {
        string id PK
        string propertyId FK
        string slug
        string name
        string description
        decimal basePrice
        int maxGuests
        int bedCount
        string bedType
        int roomSizeSqFt
        string[] amenities
        string[] images
        int totalInventory
    }

    ROOM {
        string id PK
        string roomTypeId FK
        string roomNumber
        string floor
        string status "AVAILABLE | OCCUPIED | MAINTENANCE"
    }

    BOOKING {
        string id PK
        string bookingCode UK "TBR-BOM-XXXXXX"
        string userId FK
        string guestName
        string guestEmail
        string guestPhone
        date checkInDate
        date checkOutDate
        int totalGuests
        decimal totalAmount
        string status "CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED"
        string specialRequests
        string cancellationReason
        datetime createdAt
    }

    BOOKING_ITEM {
        string id PK
        string bookingId FK
        string roomTypeId FK
        string roomId FK
        decimal nightPrice
    }

    ENQUIRY {
        string id PK
        string propertyId FK
        string fullName
        string email
        string phone
        string eventType "WEDDING | CORPORATE | PRIVATE_DINING | SHOOT | OTHER"
        date tentativeDate
        int estimatedGuests
        string message
        string status "NEW | CONTACTED | QUOTED | CLOSED"
        string internalNotes
        datetime createdAt
    }
```

---

## 2. The 14 Fictional Mumbai Boutique Properties

| # | Property Name | Slug | Precinct | Style & Provenance | Starting Rate |
|---|---|---|---|---|---|
| 1 | **The Colaba Colonial** | `the-colaba-colonial` | Colaba, South Mumbai | 1912 Victorian-Edwardian mansion steps from Gateway of India | &#8377;15,500 |
| 2 | **Marine Drive Bayview** | `marine-drive-bayview` | Marine Drive | 1930s Art Deco on Queen's Necklace promenade | &#8377;14,500 |
| 3 | **Kala Ghoda Art House** | `kala-ghoda-art-house` | Kala Ghoda | Atelier & rotating contemporary Indian art exhibition | &#8377;10,500 |
| 4 | **The Malabar Verandah** | `the-malabar-verandah` | Malabar Hill | Hanging Gardens botanical manor overlooking Back Bay | &#8377;14,000 |
| 5 | **Bandra Bohemian Villa**| `bandra-bohemian-villa` | Pali Hill, Bandra West | 1920s Indo-Portuguese bungalow with azulejo tiles | &#8377;12,500 |
| 6 | **Bandstand Ocean Mist** | `bandstand-ocean-mist` | Bandstand, Bandra West | Cliffside brutalist villa facing breaking ocean waves | &#8377;17,500 |
| 7 | **Juhu Palms Retreat** | `juhu-palms-retreat` | Juhu Beach | Beachside coconut palm bungalow with direct sand access | &#8377;13,500 |
| 8 | **Versova Coastal Sanctuary**| `versova-coastal-sanctuary`| Versova | Reclaimed dhow boat wood & Koli artisan community | &#8377;9,500 |
| 9 | **Worli Sea Face Glasshouse**| `worli-sea-face-glasshouse`| Worli Sea Face | Avant-garde glass pavilion facing Bandra-Worli Sea Link | &#8377;14,000 |
| 10| **Powai Lake Pavilions** | `powai-lake-pavilions` | Powai | Nordic timber-and-slate lakefront lodge with sauna | &#8377;11,000 |
| 11| **BKC Executive Boutique**| `bkc-executive-boutique` | Bandra Kurla Complex | Sleek Japanese minimalist corporate executive retreat | &#8377;13,000 |
| 12| **Fort Heritage Chambers**| `fort-heritage-chambers`| Fort Historic District | 19th-century Neo-Classical colonnade by Horniman Circle | &#8377;12,500 |
| 13| **Dadar Parsi Haven** | `dadar-parsi-haven` | Dadar Parsi Colony | Art Deco serenity in Mumbai's largest planned garden enclave | &#8377;9,500 |
| 14| **Girgaon Sunset Mansion**| `girgaon-sunset-mansion` | Girgaon Chowpatty | Retro coastal cultural woodwork and bay sunset views | &#8377;10,500 |
