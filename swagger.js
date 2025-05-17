const { VehicleType } = require("@prisma/client");

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'NePark API',
    version: '1.0.0',
    description: 'API documentation for NePark parking management system',
    contact: {
      name: 'Benie Giramata',
      email: 'iratuzibeniegiramata@gmail.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 4000}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          phoneNumber: { type: 'string' },
          profilePicture: { type: 'string' },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          plateNumber: { type: 'string' },
          size: { type: 'string' },
          vehicleType: { type: 'string' },
          color: { type: 'string' },
          ownerId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ParkingSlot: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          slotNumber: { type: 'string' },
          location: { type: 'string' },
          size: { type: 'string', enum: ['SMALL', 'MEDIUM', 'LARGE'] },
          vehicleType: { type: 'string', enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS'] },
          status: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SlotRequest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          vehicleId: { type: 'string' },
          slotId: { type: 'string', nullable: true },
          requestTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          responseTime: { type: 'string', format: 'date-time', nullable: true },
          responseNote: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ParkingSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vehicleId: { type: 'string' },
          slotId: { type: 'string' },
          requestId: { type: 'string', nullable: true },
          entryTime: { type: 'string', format: 'date-time' },
          exitTime: { type: 'string', format: 'date-time', nullable: true },
          fee: { type: 'number', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'PENDING_PAYMENT', 'COMPLETED'] },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          message: { type: 'string' },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          page: { type: 'number' },
          totalPages: { type: 'number' },
          perPage: { type: 'number' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication operations' },
    { name: 'Users', description: 'User operations' },
    { name: 'Vehicles', description: 'Vehicle operations' },
    { name: 'Parking', description: 'Parking operations' },
    { name: 'Parking Slots', description: 'Parking slot operations' },
    { name: 'Slot Requests', description: 'Slot request operations' },
    { name: 'Notifications', description: 'Notification operations' },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    // Auth Routes
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' },
                  password: { type: 'string', format: 'password', example: 'Benie@123' },
                  phoneNumber: { type: 'string', example: '+250789123456' }
                },
                required: ['name', 'email', 'password']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered successfully. Please verify your email.' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login a user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' },
                  password: { type: 'string', format: 'password', example: 'Benie@123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User logged in successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid credentials or account not verified',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify-email': {
      post: {
        summary: 'Verify user email with verification code',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' },
                  code: { type: 'string', example: '123456' }
                },
                required: ['email', 'code']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Email verified successfully. You can now login.' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid or expired verification code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/resend-verification': {
      post: {
        summary: 'Resend verification code to user email',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' }
                },
                required: ['email']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Verification code sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Verification code sent successfully.' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Account already verified',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request password reset',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' }
                },
                required: ['email']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset code sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password reset code sent to your email.' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset password using code',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'b.giramata20@gmail.com' },
                  code: { type: 'string', example: '123456' },
                  newPassword: { type: 'string', format: 'password', example: 'NewBenie@123' }
                },
                required: ['email', 'code', 'newPassword']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password reset successfully. You can now login with your new password.' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid or expired reset code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // User Routes
    '/api/users/profile': {
      get: {
        summary: 'Get current user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Updated Name' },
                  phoneNumber: { type: 'string', example: '+250789123456' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Profile updated successfully' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/password': {
      put: {
        summary: 'Update user password',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currentPassword: { type: 'string', format: 'password', example: 'CurrentBenie@123' },
                  newPassword: { type: 'string', format: 'password', example: 'NewBenie@123' }
                },
                required: ['currentPassword', 'newPassword']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Password updated successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Current password is incorrect',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        summary: 'Get all users (admin only)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of all users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    allOf: [
                      { $ref: '#/components/schemas/User' },
                      {
                        type: 'object',
                        properties: {
                          vehicleCount: { type: 'integer', example: 2 }
                        }
                      }
                    ]
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Vehicle Routes
    '/api/vehicles': {
      get: {
        summary: 'Get all vehicles (admin) or user\'s vehicles (user)',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of vehicles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Vehicle' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Register a new vehicle',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  plateNumber: { type: 'string', example: 'RAB123A' },
                  size: { type: 'string', example: 'large' },
                  vehicleType: { type: 'string', example: 'Toyota Corolla' },
                  color: { type: 'string', example: 'Black' }
                },
                required: ['plateNumber', 'size', 'vehicleType', 'color']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Vehicle registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vehicle' }
              }
            }
          },
          '400': {
            description: 'Vehicle with this plate number already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/vehicles/{id}': {
      get: {
        summary: 'Get vehicle by ID',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID'
          }
        ],
        responses: {
          '200': {
            description: 'Vehicle details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vehicle' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update vehicle details',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  plateNumber: { type: 'string', example: 'RAB456A' },
                  size: { type: 'string', example: 'small' },
                  vehicleType: { type: 'string', example: 'Toyota Camry' },
                  color: { type: 'string', example: 'Silver' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Vehicle updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vehicle' }
              }
            }
          },
          '400': {
            description: 'Vehicle with this plate number already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete a vehicle',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID'
          }
        ],
        responses: {
          '200': {
            description: 'Vehicle deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Vehicle deleted successfully' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Parking Routes
    '/api/parking': {
      get: {
        summary: 'Get parking sessions (admin gets all, users get their own)',
        tags: ['Parking'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'vehicleId',
            schema: { type: 'string' },
            description: 'Filter by vehicle ID'
          },
          {
            in: 'query',
            name: 'status',
            schema: { 
              type: 'string',
              enum: ['ACTIVE', 'PENDING_PAYMENT', 'COMPLETED']
            },
            description: 'Filter by session status'
          }
        ],
        responses: {
          '200': {
            description: 'List of parking sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ParkingSession' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/parking/checkin': {
      post: {
        summary: 'Check in a vehicle',
        tags: ['Parking'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vehicleId: { type: 'string', example: '12345' }
                },
                required: ['vehicleId']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Vehicle checked in successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ParkingSession' }
              }
            }
          },
          '400': {
            description: 'Vehicle is already checked in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/parking/request-checkout/{sessionId}': {
      post: {
        summary: 'Request checkout for a vehicle',
        tags: ['Parking'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'sessionId',
            required: true,
            schema: { type: 'string' },
            description: 'Parking session ID'
          }
        ],
        responses: {
          '200': {
            description: 'Checkout request submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Checkout requested successfully' },
                    session: { $ref: '#/components/schemas/ParkingSession' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Parking session is not active',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Parking session not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/parking/checkout/{sessionId}': {
      post: {
        summary: 'Check out a vehicle (admin only)',
        tags: ['Parking'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'sessionId',
            required: true,
            schema: { type: 'string' },
            description: 'Parking session ID'
          }
        ],
        responses: {
          '200': {
            description: 'Vehicle checked out successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ParkingSession' }
              }
            }
          },
          '400': {
            description: 'Parking session cannot be checked out',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Parking session not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Parking Slot Routes
    '/api/parking-slots': {
      get: {
        summary: 'Get all parking slots (admin gets all, users get available slots)',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Number of items per page'
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Search by slot number or location'
          },
          {
            in: 'query',
            name: 'status',
            schema: { 
              type: 'string',
              enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']
            },
            description: 'Filter by slot status'
          },
          {
            in: 'query',
            name: 'vehicleType',
            schema: { 
              type: 'string',
              enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']
            },
            description: 'Filter by vehicle type'
          },
          {
            in: 'query',
            name: 'size',
            schema: { 
              type: 'string',
              enum: ['SMALL', 'MEDIUM', 'LARGE']
            },
            description: 'Filter by size'
          }
        ],
        responses: {
          '200': {
            description: 'List of parking slots with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slots: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ParkingSlot' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new parking slot (admin only)',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  slotNumber: { type: 'string', example: 'A-001' },
                  location: { type: 'string', example: 'Block A, Floor 1' },
                  size: { 
                    type: 'string',
                    enum: ['SMALL', 'MEDIUM', 'LARGE']
                  },
                  vehicleType: { 
                    type: 'string',
                    enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']
                  },
                  status: { 
                    type: 'string',
                    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']
                  }
                },
                required: ['slotNumber', 'location', 'size', 'vehicleType']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Parking slot created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slot: { $ref: '#/components/schemas/ParkingSlot' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Slot number already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/parking-slots/{id}': {
      get: {
        summary: 'Get parking slot by ID',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Parking Slot ID'
          }
        ],
        responses: {
          '200': {
            description: 'Parking slot details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slot: { $ref: '#/components/schemas/ParkingSlot' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Parking slot not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update a parking slot (admin only)',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Parking Slot ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  slotNumber: { type: 'string' },
                  location: { type: 'string' },
                  size: { 
                    type: 'string',
                    enum: ['SMALL', 'MEDIUM', 'LARGE']
                  },
                  vehicleType: { 
                    type: 'string',
                    enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS']
                  },
                  status: { 
                    type: 'string',
                    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Parking slot updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slot: { $ref: '#/components/schemas/ParkingSlot' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Parking slot not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete a parking slot (admin only)',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Parking Slot ID'
          }
        ],
        responses: {
          '200': {
            description: 'Parking slot deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Cannot delete slot with active sessions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Parking slot not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/parking-slots/seed': {
      post: {
        summary: 'Seed 100 parking slots (admin only)',
        tags: ['Parking Slots'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Parking slots seeded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Parking slots already exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Slot Request Routes
    '/api/slot-requests': {
      get: {
        summary: 'Get all slot requests (admin gets all, users get their own)',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Number of items per page'
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Search by plate number or user name'
          },
          {
            in: 'query',
            name: 'status',
            schema: { 
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED']
            },
            description: 'Filter by request status'
          },
          {
            in: 'query',
            name: 'userId',
            schema: { type: 'string' },
            description: 'Filter by user ID (admin only)'
          }
        ],
        responses: {
          '200': {
            description: 'List of slot requests with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requests: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SlotRequest' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new slot request',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
         parameters: [
          {
            in: 'path',
            name: 'vehicleId',
            required: true,
            schema: { type: 'string' },
            description: 'Vehicle ID'
          }
        ],
        responses: {
          '201': {
            description: 'Slot request created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request: { $ref: '#/components/schemas/SlotRequest' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or vehicle already has a request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your vehicle',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/slot-requests/{id}': {
      get: {
        summary: 'Get slot request by ID',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Slot Request ID'
          }
        ],
        responses: {
          '200': {
            description: 'Slot request details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request: { $ref: '#/components/schemas/SlotRequest' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Slot request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update a slot request (only pending requests)',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Slot Request ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vehicleId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Slot request updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request: { $ref: '#/components/schemas/SlotRequest' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Can only update pending requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Slot request or vehicle not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete a slot request (only pending requests)',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Slot Request ID'
          }
        ],
        responses: {
          '200': {
            description: 'Slot request deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Can only delete pending requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Slot request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/slot-requests/{id}/approve': {
      post: {
        summary: 'Approve a slot request (admin only)',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Slot Request ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  slotId: { type: 'string' }
                },
                required: ['slotId']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Slot request approved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request: { $ref: '#/components/schemas/SlotRequest' },
                    session: { $ref: '#/components/schemas/ParkingSession' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Request is not pending or slot is not available',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Slot request or parking slot not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/slot-requests/{id}/reject': {
      post: {
        summary: 'Reject a slot request (admin only)',
        tags: ['Slot Requests'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Slot Request ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  note: { type: 'string', example: 'No available slots for your vehicle type' }
                },
                required: ['note']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Slot request rejected successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request: { $ref: '#/components/schemas/SlotRequest' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Request is not pending',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Slot request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    // Notification Routes
    '/api/notifications': {
      get: {
        summary: 'Get user notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of user notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Notification' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/notifications/{id}/read': {
      put: {
        summary: 'Mark a notification as read',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Notification ID'
          }
        ],
        responses: {
          '200': {
            description: 'Notification marked as read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Notification' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Not your notification',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/notifications/read-all': {
      put: {
        summary: 'Mark all user notifications as read',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All notifications marked as read',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'All notifications marked as read' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = swaggerDocument;