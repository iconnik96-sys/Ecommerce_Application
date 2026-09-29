# TASK.md — Luminary Redesign & AI Upgrade

**Branch:** `redesign/ai-upgrade`  
**Last updated:** 2026-09-29 08:49 IST  
**Progress:** 34/34 done

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Design direction: **warm editorial / lookbook** — off-white `#F5F0EB` canvas, deep ink `#1A1615` text, single restrained accent **terracotta** `#C0785A`. | Fits "Luminary" (light/glow), avoids the dark-mode-AI-template look, differentiates from typical ecommerce blue/purple. Products are tech accessories — warm tones give them a premium catalog feel. |
| D2 | Typography: **Playfair Display** (serif) for headings, **Inter** (sans) for body. | Characterful but legible; editorial feel without being too decorative. |
| D3 | Product entity gets new fields: `category`, `imageUrl`, `tags`, `stock`. `imageUrl` defaults to placeholder. Existing DTO field names preserved; new fields are additive. | Needed for AI features (category search, tagging), recommendations, and proper product display. No breaking change — old fields remain. |
| D4 | AI calls go through a single `AiService` bean that wraps Groq's OpenAI-compatible REST API using Spring's `RestClient`. No extra AI SDK dependency. | Minimal dependency footprint. Groq is OpenAI-compatible, so a simple REST wrapper suffices. |
| D5 | JWT secret hardcoded in `JwtService.java` will be moved to env var `JWT_SECRET`. | Security improvement; existing behavior unchanged. |
| D6 | Review summary cache: new `reviewSummary` text column on `Product` entity, regenerated only when review count changes. | Avoids AI call per page view; still fresh enough. |
| D7 | All new AI endpoints under `/api/ai/*` are authenticated (require valid JWT) but not role-restricted — both USER and ADMIN can use them. Rate-limited per user. | Chat assistant should work for all logged-in users. |
| D8 | Frontend stays as a Vite + React SPA (no router library added). Current view-state approach (`currentView`) is preserved but refactored into cleaner page components. | Minimizes structural churn; user's deployment on Netlify stays the same. |

---

## Audit Summary

### Backend (Spring Boot 3.5.14, Java 17)

**Package structure:** `com.ecom`
- `controller/` — 8 controllers: Auth, Product, Cart, Order, Review, User, Wishlist, Address
- `service/` — 8 services (matching controllers) + CustomUserDetailsService
- `repository/` — 10 JPA repos
- `entity/` — 10 entities: User, Product, Review, Cart, CartItem, Order, OrderItem, Wishlist, WishlistItem, Address
- `DTO/` — 17 DTOs (request + response pairs)
- `mapper/` — 9 MapStruct mappers
- `security/` — JwtAuthFilter, JwtService
- `enums/` — Role (USER, ADMIN), OrderStatus (PLACED, CANCELLED)
- `SecurityConfig.java` at root `com.ecom` package

**API endpoints (~22):**
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | Public |
| POST | `/ecom/users/register` | Public |
| GET | `/ecom/products/getAllProducts` | Public |
| GET | `/ecom/products/getByName/{name}` | Public |
| POST | `/ecom/products/addProduct` | ADMIN |
| DELETE | `/ecom/products/deleteproduct/{id}` | ADMIN |
| GET | `/ecom/users/getall` | ADMIN |
| DELETE | `/ecom/users/deleteuser/{email}` | ADMIN |
| GET | `/ecom/users/getbyemail/{email}` | Authenticated |
| PUT | `/ecom/users/editinfo/{email}` | Authenticated |
| POST | `/ecom/cart/addProduct` | Authenticated |
| GET | `/ecom/cart/viewcart/{userId}` | Authenticated |
| PUT | `/ecom/cart/updateQuantity` | Authenticated |
| POST | `/ecom/order/place/{userId}` | Authenticated |
| GET | `/ecom/order/user/{userId}` | Authenticated |
| GET | `/ecom/order/getByOrder/{orderId}` | Authenticated |
| PUT | `/ecom/order/cancel/{orderId}` | Authenticated |
| POST | `/ecom/reviews/{userId}` | Authenticated |
| GET | `/ecom/reviews/product/{productId}` | Authenticated |
| DELETE | `/ecom/reviews/{reviewId}` | Authenticated |
| POST/GET/DELETE | `/wishlist/*` | Authenticated |
| POST/GET/PUT/DELETE | `/ecom/address/*` | Authenticated |

**Issues found:**
- JWT secret is hardcoded (security risk)
- No global exception handler — raw 500s leak stack traces
- No request validation (`@Valid`) on any DTO
- No AI features exist at all
- Product entity very minimal (no category, imageUrl, tags, stock)
- No tests written (test dir is empty)
- `@CrossOrigin("*")` on individual controllers redundant with SecurityConfig CORS

### Frontend (Vite 8, React 19, Axios)

**Structure:**
- `App.jsx` — monolithic 1253-line file containing ALL views (shop, admin, user-dashboard, product detail modal)
- `components/` — 5 components: AuthModal, CartDrawer, ProductCard, AdminPanel, Toast
- `services/api.js` — Axios instance with JWT interceptor, all API service methods
- `index.css` — 1376-line design system (dark slate theme, blue/emerald accents)

**Pages/Views (all in App.jsx):**
- Shop (hero banner + product grid with search & sort)
- Admin dashboard (overview, inventory/CRUD, orders, user registry)
- User dashboard (order history, wishlist, addresses, profile)
- Product detail modal (info + reviews)
- Auth modal (login/register)
- Cart drawer (slide-out sidebar)

**Design issues (per spec requirements):**
- Dark blue/slate canvas with blue gradients — typical "AI template" look
- `gradient-text` class used for headings — explicitly forbidden
- Glassmorphism panels (`glass-panel`, `glass-card`) everywhere
- Emoji-based product images (🎧📱💻) — no real imagery
- "Discover the Future of Premium Commerce" hero copy — generic buzzword
- Centered hero section — explicitly called out as to-avoid
- No loading skeletons — just text spinners
- No proper responsive design — inline styles, no mobile testing

### Products / Catalog

20 tech accessories (CSV seeded):
Wireless Mouse ($19.99), Mechanical Keyboard ($54.99), USB-C Hub ($29.99), Bluetooth Headphones ($79.99), Laptop Stand ($24.99), Webcam 1080p ($34.99), Portable SSD 1TB ($89.99), Smartphone Case ($12.99), Wireless Charger ($17.99), Gaming Mouse Pad ($14.99), Desk Lamp LED ($22.99), Power Bank 10000mAh ($25.99), HDMI Cable 2m ($8.99), Bluetooth Speaker ($39.99), Laptop Backpack ($44.99), Smartwatch ($59.99), Ethernet Cable 10ft ($9.99), Monitor 24 inch ($129.99), Wireless Earbuds ($49.99), Graphic Tablet ($64.99)

**Category:** All tech accessories / peripherals. No explicit category field exists — all flat.

### Existing AI Features

**None.** No AI service, no Groq integration, no chatbot, no recommendation engine.

---

## Tasks

### Phase 1: Foundation & Backend Prep

- [x] **T01** Create `.env.example` with all env vars (DB, JWT_SECRET, GROQ_API_KEY, GROQ_MODEL, FRONTEND_URL_TEST)
- [x] **T02** Move JWT secret to env var `JWT_SECRET` in JwtService; update application.properties
- [x] **T03** Add global exception handler (`@ControllerAdvice`) with consistent error JSON `{ error, message, status }`
- [x] **T04** Add `@Valid` annotations and validation constraints on all request DTOs
- [x] **T05** Extend Product entity: add `category`, `imageUrl`, `tags` (String), `stock` (int), `reviewSummary` (text). Update ProductRequestDTO/ResponseDTO (additive only). Update mapper.
- [x] **T06** Add full-text search support to ProductRepo: `@Query` for keyword + category + price range filtering

### Phase 2: AI Backend

- [x] **T07** Add Groq/OpenAI REST client config: `AiConfig` bean with `RestClient`, timeout, retry via env vars
- [x] **T08** Create `AiService` — chat completion wrapper with system prompt, structured JSON parsing, and fallback
- [x] **T09** POST `/api/ai/chat` endpoint — shopping assistant with DB grounding, product validation, guardrails
- [x] **T10** POST `/api/ai/search` endpoint — natural-language search → structured filters → product results
- [x] **T11** GET `/api/ai/recommendations/{productId}` — "You may also like" using AI + category matching
- [x] **T12** GET `/api/ai/review-summary/{productId}` — AI review summarizer with DB caching
- [x] **T13** POST `/api/ai/admin/generate-description` — AI product description generator (ADMIN only)
- [x] **T14** POST `/api/ai/admin/suggest-tags` — AI tag/category suggester (ADMIN only)
- [x] **T15** Add rate limiting per user (Bucket4j or simple in-memory) on AI endpoints
- [x] **T16** Update SecurityConfig to permit/authenticate new `/api/ai/*` endpoints
- [x] **T17** Write unit tests for AiService (mock RestClient / Groq responses)

### Phase 3: Frontend Redesign

- [x] **T18** Define new design tokens (CSS variables): warm editorial palette, type scale, spacing, new radius/shadows
- [x] **T19** Redesign Header/Navbar: editorial style, warm palette, Playfair Display wordmark
- [x] **T20** Redesign Home page: asymmetric layout, real product imagery placeholders, specific microcopy, category browsing
- [x] **T21** Redesign Product Listing: filters sidebar (category, price range), sort controls, grid/list toggle, loading skeletons
- [x] **T22** Redesign Product Detail page: large imagery, specs, reviews with AI summary, "You may also like" section
- [x] **T23** Redesign Cart & Checkout: slide-out cart with product images, checkout flow with address selection
- [x] **T24** Redesign Auth (Login/Register): warm styled modal/page, no gradient text
- [x] **T25** Redesign User Dashboard: order history, wishlist, addresses, profile — editorial card style
- [x] **T26** Redesign Admin Dashboard: clean data tables, product form with AI description/tag generators, order management
- [x] **T27** Add loading skeletons, empty states, and error states across all pages
- [x] **T28** Mobile-first responsive pass: all breakpoints, touch targets, collapsible nav

### Phase 4: AI Frontend Integration

- [x] **T29** Build AI Chat Widget: floating panel on every page, message bubbles, typing indicator, product cards in chat, "Add to cart" from chat
- [x] **T30** Integrate natural-language search bar: convert user input via `/api/ai/search`, show filtered results
- [x] **T31** Integrate "You may also like" on product detail and cart pages
- [x] **T32** Integrate AI review summary display on product detail page
- [x] **T33** Integrate AI description generator + tag suggester into admin product form

### Phase 5: Docs & Final

- [x] **T34** Create `README.md` with project overview, architecture diagram, setup, API table, AI explanation, deployment notes

---

## Blockers

_None._

---

## Verification Log

| Task | Date | Result | Notes |
|------|------|--------|-------|
| T01-T06 | 2026-09-29 | Passed | Backend foundation: .env.example, JWT env var, GlobalExceptionHandler, DTO validation, Product fields, search repo |
| T07-T16 | 2026-09-29 | Passed | AI backend: Groq REST integration, chat assistant with catalog grounding, NL search, recs, review summary, admin AI copy/tagging, rate limiting |
| T17 | 2026-09-29 | Passed | 4/4 unit tests passed with Maven Surefire (mock-maker-subclass) |
| T18-T28 | 2026-09-29 | Passed | Editorial warm design system: Playfair Display + Inter fonts, lookbook hero, real photography mapping, responsive layout, cart drawer, modals |
| T29-T33 | 2026-09-29 | Passed | AI frontend integrations: Floating Concierge chat with inline "+ Add to Bag" cards, NL search bar, review summary card, recommendations, admin AI generator buttons |
| T34 | 2026-09-29 | Passed | Comprehensive README.md with architecture diagram, API reference, AI features, and setup guide |

