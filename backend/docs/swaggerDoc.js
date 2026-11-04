const express = require('express');
const router = express.Router();

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DropCart Enterprise AI E-Commerce API',
    version: '2.0.0',
    description: 'Complete API reference for DropCart Enterprise: E-Commerce Storefront, Gemini AI Shopping Guide, Razorpay Gateway, Real-Time Socket.IO, Staff RBAC, and Admin Control Center.',
    contact: {
      name: 'DropCart Developer Team',
      email: 'dev@dropcart.com',
      url: 'https://github.com/Aquib02/DropCart'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    },
    {
      url: '/',
      description: 'Production Origin Server'
    }
  ],
  tags: [
    { name: 'Authentication & Users', description: 'Customer login, register, profile, and staff management' },
    { name: 'Products & Inventory', description: 'Product catalog, category filters, variants, and stock management' },
    { name: 'AI Shopping & Vision', description: 'Gemini AI Assistant, NL search, visual image search, and compare analysis' },
    { name: 'Orders & Live Tracking', description: 'Order checkout, history, status updates, and sales analytics' },
    { name: 'Coupons & Discounts', description: 'Promotional discount codes, validation, and usage limits' },
    { name: 'Storefront Appearance', description: 'Hero banners, themes, announcement marquee, and live sync' },
    { name: 'Payments (Razorpay)', description: 'Order payment creation, cryptographic HMAC verification, and webhooks' }
  ],
  paths: {
    '/api/users/login': {
      post: {
        tags: ['Authentication & Users'],
        summary: 'Customer and Admin login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'customer@dropcart.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful authentication returning JWT token and user info' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/users/register': {
      post: {
        tags: ['Authentication & Users'],
        summary: 'Register new customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Aquib' },
                  email: { type: 'string', example: 'aquib@dropcart.com' },
                  password: { type: 'string', example: 'securePass123' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { description: 'User already exists or validation error' }
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products & Inventory'],
        summary: 'List products with filters, search, and sorting',
        parameters: [
          { name: 'keyword', in: 'query', schema: { type: 'string' }, description: 'Search keyword' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category (e.g. Mobiles, Fashion)' },
          { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Sort order: price-asc, price-desc, rating, popular' },
          { name: 'inStockOnly', in: 'query', schema: { type: 'boolean' }, description: 'Filter in-stock items only' }
        ],
        responses: {
          200: { description: 'List of matching products' }
        }
      },
      post: {
        tags: ['Products & Inventory'],
        summary: 'Create product (Admin / Staff)',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Product created' },
          403: { description: 'Forbidden: Admin access required' }
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products & Inventory'],
        summary: 'Get product details by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Product object with variants, specifications, and reviews' },
          404: { description: 'Product not found' }
        }
      }
    },
    '/api/ai/chat': {
      post: {
        tags: ['AI Shopping & Vision'],
        summary: 'Chat with Gemini-powered AI Shopping Guide (grounded in MongoDB catalog)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Best 5G phone under ₹25,000 for gaming' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'AI conversational advice and grounded catalog product cards' }
        }
      }
    },
    '/api/ai/visual-search': {
      post: {
        tags: ['AI Shopping & Vision'],
        summary: 'Visual product search by uploaded image (Gemini Vision + Catalog Match)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  imageBase64: { type: 'string', description: 'Base64 image string' },
                  mimeType: { type: 'string', example: 'image/jpeg' },
                  category: { type: 'string', example: 'Shoes' },
                  fileName: { type: 'string', example: 'formal_shoes.jpg' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Visually similar in-stock products matching uploaded photo' }
        }
      }
    },
    '/api/ai/compare-analysis': {
      post: {
        tags: ['AI Shopping & Vision'],
        summary: 'Side-by-side comparison analysis for up to 4 products',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productIds'],
                properties: {
                  productIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['653f81e3a...', '653f8202b...']
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Comparison specs, value winner, and top-rated recommendation' }
        }
      }
    },
    '/api/orders': {
      post: {
        tags: ['Orders & Live Tracking'],
        summary: 'Place new customer order',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderItems', 'shippingAddress', 'paymentMethod', 'totalPrice'],
                properties: {
                  orderItems: { type: 'array', items: { type: 'object' } },
                  shippingAddress: { type: 'object' },
                  paymentMethod: { type: 'string', enum: ['COD', 'Online'] },
                  totalPrice: { type: 'number', example: 4999 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Order placed successfully' }
        }
      }
    },
    '/api/orders/myorders': {
      get: {
        tags: ['Orders & Live Tracking'],
        summary: 'Get logged-in customer order history with delivery stages',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of customer orders' }
        }
      }
    },
    '/api/orders/stats': {
      get: {
        tags: ['Orders & Live Tracking'],
        summary: 'Get admin sales and inventory analytics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Total revenue, orders count, low stock counts, and charts' }
        }
      }
    },
    '/api/coupons/apply': {
      post: {
        tags: ['Coupons & Discounts'],
        summary: 'Validate and calculate discount for coupon code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'cartTotal'],
                properties: {
                  code: { type: 'string', example: 'DIWALI10' },
                  cartTotal: { type: 'number', example: 2500 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Discount amount and applied coupon info' }
        }
      }
    },
    '/api/settings': {
      get: {
        tags: ['Storefront Appearance'],
        summary: 'Get active store appearance, banner headlines, and theme color',
        responses: {
          200: { description: 'Store settings object' }
        }
      },
      put: {
        tags: ['Storefront Appearance'],
        summary: 'Publish live appearance and theme changes (Admin / Staff)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  heroTitle: { type: 'string' },
                  heroSubtitle: { type: 'string' },
                  heroBadge: { type: 'string' },
                  themeColor: { type: 'string', enum: ['orange', 'indigo', 'emerald', 'rose', 'blue'] },
                  announcement: { type: 'string' },
                  bannerActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Updated settings broadcasted via Socket.IO' }
        }
      }
    },
    '/api/payment/create-order': {
      post: {
        tags: ['Payments (Razorpay)'],
        summary: 'Create Razorpay order for online payment',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'amount'],
                properties: {
                  orderId: { type: 'string' },
                  amount: { type: 'number', example: 4999 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Razorpay order details with amount in paise and keyId' }
        }
      }
    },
    '/api/payment/verify': {
      post: {
        tags: ['Payments (Razorpay)'],
        summary: 'Cryptographically verify payment signature & capture order',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'razorpayOrderId', 'razorpayPaymentId'],
                properties: {
                  orderId: { type: 'string' },
                  razorpayOrderId: { type: 'string' },
                  razorpayPaymentId: { type: 'string' },
                  razorpaySignature: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Payment verified and order marked as paid' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

// Return OpenAPI JSON Schema
router.get('/spec.json', (req, res) => {
  res.json(openApiSpec);
});

// Interactive Swagger UI HTML Page
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DropCart API Documentation • Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=64&q=80" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .top-brand {
      background: #0f172a;
      color: white;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #f97316;
    }
    .top-brand .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: -0.5px;
    }
    .top-brand .badge {
      background: #f97316;
      color: white;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .top-brand a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
    }
    .top-brand a:hover {
      color: white;
    }
  </style>
</head>
<body>
  <div class="top-brand">
    <div class="logo">
      <span>🛍️ DropCart</span>
      <span class="badge">API v2.0 • Live</span>
    </div>
    <div>
      <a href="/api/docs/spec.json" target="_blank">View Raw JSON Spec →</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/spec.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
