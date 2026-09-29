# ✦ LUMINARY — Curated Tech Accessories & AI Shopping Concierge

> **Luminary** is an editorial e-commerce platform and modern workspace lookbook for tech accessories, tactile peripherals, and desk essentials. Built with Spring Boot 3, React 19, PostgreSQL, and Groq-powered AI services.

---

## 1. Architectural Overview

```
                               ┌────────────────────────────────────────────────┐
                               │             React 19 Frontend SPA              │
                               │  Vite • Vanilla CSS Editorial Design System    │
                               └──────────────────────┬─────────────────────────┘
                                                      │ REST + JWT Bearer
                                                      ▼
                               ┌────────────────────────────────────────────────┐
                               │           Spring Boot 3.5.14 Backend           │
                               │  Java 17 • Spring Security 6 • Spring Data JPA │
                               └──────────┬──────────────────────────┬──────────┘
                                          │                          │
                 Database Queries (JPA)   │                          │ OpenAI-compatible REST
                                          ▼                          ▼
                   ┌──────────────────────────────┐        ┌─────────────────────────┐
                   │    PostgreSQL (Supabase)     │        │     Groq AI Engine      │
                   │ Products • Users • Orders    │        │  Llama-3.3-70b-versatile│
                   │ Reviews  • Carts • Addresses │        │  Catalog Grounding      │
                   └──────────────────────────────┘        └─────────────────────────┘
```

---

## 2. Core Capabilities & AI Upgrades

### AI Shopping Concierge (`/api/ai/chat`)
- Grounded in real-time database catalog listings (live prices, inventory, tags, categories).
- Guardrails prevent hallucinations or pricing fabrication.
- Inline product cards with direct "+ Add to Bag" capability inside the chat bubble.
- Session message history support (up to 10 context turns).

### Natural Language Search (`/api/ai/search`)
- Converts free-form human queries (e.g., *"ergonomic mouse under $30"* or *"mechanical keyboard for coding"*) into structured filters (`keyword`, `category`, `minPrice`, `maxPrice`).
- Queries database using custom JPA multi-field filtering with fuzzy matching.
- Instant fallback to standard text search if AI parsing is unavailable.

### Smart Catalog Recommendations (`/api/ai/recommendations/{productId}`)
- Delivers "You May Also Like" pairings based on category and complementary accessory analysis.

### Review Digest Summarizer (`/api/ai/review-summary/{productId}`)
- Summarizes verified customer feedback into concise, informative pros/cons digests.
- Automatically caches summaries in the database to prevent redundant LLM invocations.

### Admin AI Marketing Tools
- **AI Product Description Generator (`/api/ai/admin/generate-description`)**: Crafts luxury, non-cliché product copy tailored for high-end gear.
- **AI Tag & Category Suggester (`/api/ai/admin/suggest-tags`)**: Recommends search keywords and categorizations automatically.

### Rate Limiting & Security
- Token-bucket in-memory rate limiter per user ID (10 AI requests/minute).
- Fully integrated with Spring Security JWT filter and global exception handling.

---

## 3. Design System & Aesthetics

Luminary diverges from generic dark-blue tech templates, employing a **warm editorial lookbook** aesthetic:
- **Canvas & Tone**: Off-white warm canvas (`#F5F0EB`, `#EDE7E0`) and deep ink typography (`#1A1615`).
- **Accent**: Refined terracotta (`#C0785A`).
- **Typography**: Editorial serif headings in **Playfair Display**, clean high-legibility body in **Inter**.
- **Imagery**: Real curated photography with crisp aspect ratios, subtle hover transitions, and accessible alt descriptions.
- **Micro-interactions**: Animated skeleton loaders, slide-out drawer transitions, accessible ARIA roles, and responsive touch layouts.

---

## 4. API Reference

### Authentication & User Management
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate credentials & generate JWT |
| `POST` | `/ecom/users/register` | Public | Register new customer or administrator account |
| `GET` | `/ecom/users/getall` | ADMIN | View all registered accounts |
| `DELETE` | `/ecom/users/deleteuser/{email}` | ADMIN | Delete user by email |
| `GET` | `/ecom/users/getbyemail/{email}` | Authenticated | Retrieve profile details |
| `PUT` | `/ecom/users/editinfo/{email}` | Authenticated | Update user name and password |

### Product Catalog
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ecom/products/getAllProducts` | Public | Retrieve entire product catalog |
| `GET` | `/ecom/products/getByName/{name}` | Public | Search products by name keyword |
| `POST` | `/ecom/products/addProduct` | ADMIN | Add or update a product |
| `DELETE` | `/ecom/products/deleteproduct/{id}` | ADMIN | Remove product from catalog |

### AI Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Authenticated | AI concierge conversation grounded in DB |
| `POST` | `/api/ai/search` | Authenticated | Natural language query to product results |
| `GET` | `/api/ai/recommendations/{productId}` | Authenticated | Complementary product recommendations |
| `GET` | `/api/ai/review-summary/{productId}` | Authenticated | AI summary of customer reviews |
| `POST` | `/api/ai/admin/generate-description` | ADMIN | AI description writer |
| `POST` | `/api/ai/admin/suggest-tags` | ADMIN | AI tag and category recommender |

### Cart, Orders, Reviews, Wishlist, Addresses
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/ecom/cart/addProduct` | Authenticated | Add item to shopping bag |
| `GET` | `/ecom/cart/viewcart/{userId}` | Authenticated | Retrieve customer bag contents |
| `PUT` | `/ecom/cart/updateQuantity` | Authenticated | Increment or decrement item qty |
| `POST` | `/ecom/order/place/{userId}` | Authenticated | Place order from active cart |
| `GET` | `/ecom/order/user/{userId}` | Authenticated | List all customer orders |
| `PUT` | `/ecom/order/cancel/{orderId}` | Authenticated | Cancel active order |
| `POST` | `/ecom/reviews/{userId}` | Authenticated | Submit review & star rating |
| `GET` | `/ecom/reviews/product/{id}` | Authenticated | Fetch reviews for product |
| `DELETE`| `/ecom/reviews/{reviewId}` | Authenticated | Delete customer review |
| `POST/GET/DELETE` | `/wishlist/*` | Authenticated | Manage saved items |
| `POST/GET/PUT/DELETE` | `/ecom/address/*` | Authenticated | Manage customer shipping addresses |

---

## 5. Local Setup & Configuration

### Prerequisites
- Java 17+
- Node.js 18+ (for frontend)
- PostgreSQL database (or local instance)
- Groq API Key ([console.groq.com](https://console.groq.com))

### Environment Configuration
Copy `.env.example` to your local environment file:

```bash
cp .env.example .env
```

| Key | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/ecom_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `secret` |
| `JWT_SECRET` | 256-bit secret key for JWT signing | `c3VwZXJzZWNyZXRqd3R0b2tlbjEyMzQ1Njc4OTA=` |
| `GROQ_API_KEY` | Groq API Key | `gsk_...` |
| `GROQ_MODEL` | LLM model identifier | `llama-3.3-70b-versatile` |

### Running Backend
```bash
cd Ecommerce-Backend
./mvnw clean spring-boot:run
```
Backend runs on `http://localhost:8080`.

### Running Frontend
```bash
cd ecommerce-frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 6. Deployment Guide

### A. Database (Supabase PostgreSQL)
1. In your **Supabase Dashboard**, open **Project Settings** > **Database**.
2. Scroll down to **Connection String** and choose the **Transaction Pooler** (or **Session Pooler**) tab on port `6543` (this provides IPv4 support needed by cloud platforms like Render).
3. Copy the connection URI:
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres
   ```
4. Or in standard JDBC format:
   ```
   jdbc:postgresql://aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```

---

### B. Backend Deployment (Render)
1. Sign in to [Render](https://render.com) and click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `luminary-backend`
   - **Language / Runtime**: `Docker`
   - **Root Directory**: `Ecommerce-Backend` (or leave blank; root Dockerfile is also supported)
   - **Health Check Path**: `/api/health`
4. Add the following **Environment Variables**:
   | Key | Value / Example |
   |---|---|
   | `DB_URL` | Your Supabase connection string from Step A |
   | `DB_USERNAME` | `postgres.[YOUR-PROJECT-REF]` (if not included in DB_URL) |
   | `DB_PASSWORD` | Your Supabase database password |
   | `JWT_SECRET` | A secure random 32+ character string (e.g. `openssl rand -base64 48`) |
   | `GROQ_API_KEY` | Your Groq API key (`gsk_...`) |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` (optional; `*.vercel.app` is pre-whitelisted) |
5. Click **Create Web Service**. Once deployed, copy your Render service URL (e.g. `https://luminary-backend.onrender.com`).

---

### C. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
2. Import your GitHub repository.
3. In project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and choose `ecommerce-frontend`
4. Add the **Environment Variable**:
   - Key: `VITE_API_BASE_URL` (or `VITE_API_URL`)
   - Value: `https://luminary-backend.onrender.com` (your Render backend URL, without trailing slash)
5. Click **Deploy**. Vercel will build the SPA and route all URLs seamlessly using `vercel.json`.

