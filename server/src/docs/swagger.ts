export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Mini ERP CRM API',
    version: '1.0.0',
    description: 'Production-ready backend API for the Mini ERP CRM Portal. Includes Role-Based Access Control, JWT Authentication, and Stock Management.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server'
    },
    {
      url: 'https://mini-erp-crm-business-operations-portal.onrender.com/api',
      description: 'Production Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (from /auth/login)'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'sales', 'warehouse', 'accounts'] }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'User Login',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Successful login' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get Current User',
        tags: ['Auth'],
        responses: {
          '200': { description: 'User profile' }
        }
      }
    },
    '/products': {
      get: {
        summary: 'List Products',
        tags: ['Products'],
        responses: {
          '200': { description: 'List of products' }
        }
      }
    },
    '/challans': {
      get: {
        summary: 'List Challans',
        tags: ['Challans'],
        responses: {
          '200': { description: 'List of challans' }
        }
      }
    }
  }
};
