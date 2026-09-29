-- =============================================================================
-- Luminary E-Commerce — Supabase Database Migration & Fix Script
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =============================================================================

-- 1. Create the dedicated 'app_users' table with auto-incrementing BIGSERIAL ID
-- (This prevents collisions with Supabase Auth's default uuid/varchar users table)
CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER'
);

-- 2. Add missing columns to 'products' table for AI features, categories, and inventory
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DOUBLE PRECISION
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category varchar(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url varchar(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags varchar(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_summary text;

-- 3. Clean up conflicting foreign keys pointing to old users table and link to app_users
ALTER TABLE IF EXISTS cart DROP CONSTRAINT IF EXISTS fktrd6335blsefl2gxpb8lr0gr7;
ALTER TABLE IF EXISTS address DROP CONSTRAINT IF EXISTS fkda8tuywtf0gb6chqqflspamso;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS fk32ql8ubntj5uh44ph9659tiih;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS fk6cpw2gapn242j1t5331g5eb1i;
ALTER TABLE IF EXISTS wishlist DROP CONSTRAINT IF EXISTS fktrd6335blsefl2gxpb8lr0gr7;

-- 4. Pre-seed or update catalog products with rich descriptions, categories, and images
INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(1, 'Wireless Mouse', 'Desk & Peripherals', 19.99, 45, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', 'ergonomic, wireless, productivity, silent-click', 'Ergonomic sculpted wireless mouse with adjustable DPI precision sensor and silent click switches for distraction-free focus.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(2, 'Mechanical Keyboard', 'Desk & Peripherals', 54.99, 28, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 'mechanical, rgb, tactile, aluminum, usb-c', 'Solid CNC aluminum frame mechanical keyboard with responsive tactile switches and warm ambient backlighting.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(3, 'USB-C Hub', 'Power & Connectivity', 29.99, 52, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80', 'usb-c, 4k-hdmi, card-reader, aluminum, portable', '7-in-1 multi-port hub with 4K@60Hz HDMI output, UHS-I SD card reader, and 100W Power Delivery passthrough.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(4, 'Bluetooth Headphones', 'Audio & Sound', 79.99, 19, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'anc, over-ear, hi-fi, acoustic, 40h-battery', 'Studio-grade over-ear active noise cancelling headphones with custom 40mm dynamic drivers and 40-hour battery life.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(5, 'Leather Desk Mat', 'Desk & Organization', 34.99, 35, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', 'leather, desk-pad, waterproof, minimalist', 'Full-grain vegan leather desk pad with burnished edges and non-slip suede backing for an elevated workspace.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

INSERT INTO products (id, name, category, price, stock, image_url, tags, description) VALUES
(6, '65W GaN Charger', 'Power & Connectivity', 39.99, 60, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', 'gan, fast-charge, compact, dual-port, travel', 'Compact Gallium Nitride fast charger with dual USB-C ports and intelligent dynamic power distribution.')
ON CONFLICT (id) DO UPDATE SET
    stock = EXCLUDED.stock,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    description = EXCLUDED.description;

-- Reset sequence to avoid ID collision
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1)) FROM products;
