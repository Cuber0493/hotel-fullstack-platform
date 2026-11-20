export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'The Bombay Reserve API',
    version: '1.0.0',
    description:
      'High-performance reservation, enquiry, and operational analytics platform for The Bombay Reserve luxury boutique hotel collective in Mumbai.',
    contact: {
      name: 'The Bombay Reserve Engineering Team',
      email: 'engineering@bombayreserve.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Base',
    },
    {
      url: 'https://the-bombay-reserve-api.onrender.com/api',
      description: 'Production Render Cloud Server',
    },
    {
      url: 'http://localhost:4000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your 15-minute access JWT token in the Authorization header: Bearer <token>',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HttpOnly, Secure, SameSite refresh token cookie for session extension.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Invalid input parameters',
              },
              details: {
                type: 'object',
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Anya Mehta' },
          email: { type: 'string', format: 'email', example: 'guest@example.com' },
          role: { type: 'string', enum: ['GUEST', 'ADMIN'], example: 'GUEST' },
        },
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'The Colaba Colonial' },
          city: { type: 'string', example: 'Mumbai' },
          address: { type: 'string', example: '14 Arthur Bunder Road, Colaba, Mumbai 400005' },
          description: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
          imageUrls: { type: 'array', items: { type: 'string' } },
        },
      },
      RoomType: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          propertyId: { type: 'string' },
          canonicalName: { type: 'string', example: 'Heritage Grand Suite' },
          capacity: { type: 'integer', example: 2 },
          baseRateInr: { type: 'number', example: 45000 },
          description: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bookingCode: { type: 'string', example: 'TBR-BOM-882194' },
          roomId: { type: 'string' },
          checkIn: { type: 'string', format: 'date', example: '2026-12-01' },
          checkOut: { type: 'string', format: 'date', example: '2026-12-04' },
          guests: { type: 'integer', example: 2 },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
          },
          totalInr: { type: 'number', example: 135000 },
          originalCurrency: { type: 'string', example: 'INR' },
        },
      },
      Enquiry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          propertyId: { type: 'string' },
          name: { type: 'string', example: 'Natasha Poonawalla' },
          email: { type: 'string', format: 'email', example: 'natasha@example.com' },
          message: { type: 'string' },
          status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MetricsSummary: {
        type: 'object',
        properties: {
          occupancyRate: { type: 'number', example: 0.75 },
          adr: { type: 'number', example: 38500 },
          revpar: { type: 'number', example: 28875 },
          totalRevenueInr: { type: 'number', example: 2887500 },
          roomNightsSold: { type: 'integer', example: 75 },
          roomNightsAvailable: { type: 'integer', example: 100 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    uptime: { type: 'number' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register New Guest User',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  name: { type: 'string', example: 'Anya Mehta' },
                  email: { type: 'string', format: 'email', example: 'guest@example.com' },
                  password: { type: 'string', minLength: 8, example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully. Sets httpOnly refreshToken cookie.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate User',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful. Returns access JWT and sets rotated httpOnly cookie.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate Refresh Token',
        tags: ['Authentication'],
        security: [{ CookieAuth: [] }],
        responses: {
          200: {
            description: 'Token rotated successfully. Delivers new access token and new rotated cookie.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid or revoked token (reuse triggers automatic family revocation)' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke Session and Clear Cookie',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Session revoked successfully and cookie discarded' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated User',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/properties': {
      get: {
        summary: 'List All 14 Boutique Properties',
        tags: ['Properties'],
        responses: {
          200: {
            description: 'Array of Mumbai boutique properties',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    properties: { type: 'array', items: { $ref: '#/components/schemas/Property' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create New Property (Admin Only)',
        tags: ['Properties'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Property' },
            },
          },
        },
        responses: {
          201: { description: 'Property created successfully' },
          403: { description: 'Forbidden - Admin role required' },
        },
      },
    },
    '/properties/{id}': {
      get: {
        summary: 'Get Property Details with Room Types',
        tags: ['Properties'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Property details returned' },
          404: { description: 'Property not found' },
        },
      },
    },
    '/properties/{id}/images': {
      post: {
        summary: 'Upload Property Gallery Image to Cloudinary (Admin Only)',
        tags: ['Properties'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Image uploaded and stored in Cloudinary' },
          400: { description: 'Invalid image format or file size exceeded (>5MB)' },
        },
      },
    },
    '/rooms/search': {
      get: {
        summary: 'Search Rooms with Availability, Date, and Tariff Filters',
        tags: ['Rooms'],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'checkIn', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'checkOut', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'guests', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'amenities', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc'] } },
        ],
        responses: {
          200: {
            description: 'Filtered rooms with pricing and availability status',
          },
        },
      },
    },
    '/bookings': {
      get: {
        summary: 'List Bookings (Guests see own, Admin sees all)',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'List of reservations',
          },
        },
      },
      post: {
        summary: 'Create Room Reservation with Double-Booking Prevention',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roomId', 'checkIn', 'checkOut', 'guests'],
                properties: {
                  roomId: { type: 'string' },
                  checkIn: { type: 'string', format: 'date' },
                  checkOut: { type: 'string', format: 'date' },
                  guests: { type: 'integer', minimum: 1 },
                  guestName: { type: 'string' },
                  guestEmail: { type: 'string', format: 'email' },
                  specialRequests: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking confirmed with unique reservation reference' },
          409: { description: 'Conflict: Selected room is already reserved for the chosen dates' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel Reservation (Guest owner or Admin)',
        tags: ['Bookings'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Trip itinerary altered' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reservation cancelled' },
          403: { description: 'Unauthorized to cancel this reservation' },
        },
      },
    },
    '/enquiries': {
      get: {
        summary: 'List All Bespoke Event Enquiries (Admin Only)',
        tags: ['Enquiries'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Enquiry list returned' },
        },
      },
      post: {
        summary: 'Submit Bespoke Event / Wedding / Shoot Enquiry',
        tags: ['Enquiries'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId', 'name', 'email', 'message'],
                properties: {
                  propertyId: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Enquiry submitted to concierge' },
        },
      },
    },
    '/enquiries/{id}/status': {
      patch: {
        summary: 'Update Enquiry Triage Status (Admin Only)',
        tags: ['Enquiries'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUOTED', 'CLOSED'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated' },
        },
      },
    },
    '/admin/metrics': {
      get: {
        summary: 'Executive Hotel Performance Analytics (Occupancy, ADR, RevPAR)',
        tags: ['Admin Analytics'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'Calculated metrics with mathematical identity RevPAR = Occupancy x ADR',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    overall: { $ref: '#/components/schemas/MetricsSummary' },
                    byProperty: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          propertyId: { type: 'string' },
                          propertyName: { type: 'string' },
                          metrics: { $ref: '#/components/schemas/MetricsSummary' },
                        },
                      },
                    },
                    dailyTrend: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          403: { description: 'Executive access restricted - Admin role required' },
        },
      },
    },
  },
};
