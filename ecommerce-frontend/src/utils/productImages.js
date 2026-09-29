// Curated editorial photography for Luminary catalog
// High-resolution, warm minimalist tech aesthetic from Unsplash

const PRODUCT_IMAGE_MAP = {
  'wireless mouse': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
  'mechanical keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'usb-c hub': 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
  'bluetooth headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'laptop stand': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  'webcam 1080p': 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80',
  'portable ssd 1tb': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
  'smartphone case': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80',
  'wireless charger': 'https://images.unsplash.com/photo-1622445268045-8c704f762699?auto=format&fit=crop&w=800&q=80',
  'gaming mouse pad': 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
  'desk lamp led': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  'power bank 10000mah': 'https://images.unsplash.com/photo-1609592424364-c09ecbb75d7b?auto=format&fit=crop&w=800&q=80',
  'hdmi cable 2m': 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80',
  'bluetooth speaker': 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  'laptop backpack': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'smartwatch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'ethernet cable 10ft': 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80',
  'monitor 24 inch': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
  'wireless earbuds': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
  'graphic tablet': 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
};

const CATEGORY_IMAGE_MAP = {
  'Audio & Sound': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'Desk & Peripherals': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'Power & Connectivity': 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
  'Wearables & Gear': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'Displays & Video': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80';

export function getProductImage(product) {
  if (!product) return DEFAULT_IMAGE;
  if (product.imageUrl && product.imageUrl.startsWith('http')) {
    return product.imageUrl;
  }
  const name = (product.name || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return url;
    }
  }
  // Keyword checks
  if (name.includes('headphone') || name.includes('earbud') || name.includes('speaker') || name.includes('audio')) {
    return CATEGORY_IMAGE_MAP['Audio & Sound'];
  }
  if (name.includes('keyboard') || name.includes('mouse') || name.includes('pad') || name.includes('stand') || name.includes('lamp') || name.includes('tablet')) {
    return CATEGORY_IMAGE_MAP['Desk & Peripherals'];
  }
  if (name.includes('charger') || name.includes('cable') || name.includes('power') || name.includes('hub') || name.includes('ssd')) {
    return CATEGORY_IMAGE_MAP['Power & Connectivity'];
  }
  if (name.includes('watch') || name.includes('case') || name.includes('backpack')) {
    return CATEGORY_IMAGE_MAP['Wearables & Gear'];
  }
  if (name.includes('monitor') || name.includes('webcam')) {
    return CATEGORY_IMAGE_MAP['Displays & Video'];
  }
  return DEFAULT_IMAGE;
}

export function getProductCategory(product) {
  if (!product) return 'General';
  if (product.category && product.category.trim() && product.category !== 'General') {
    return product.category;
  }
  const name = (product.name || '').toLowerCase();
  if (name.includes('headphone') || name.includes('earbud') || name.includes('speaker')) return 'Audio & Sound';
  if (name.includes('keyboard') || name.includes('mouse') || name.includes('stand') || name.includes('lamp') || name.includes('tablet')) return 'Desk & Peripherals';
  if (name.includes('hub') || name.includes('cable') || name.includes('charger') || name.includes('power') || name.includes('ssd')) return 'Power & Connectivity';
  if (name.includes('watch') || name.includes('backpack') || name.includes('case')) return 'Wearables & Gear';
  if (name.includes('monitor') || name.includes('webcam')) return 'Displays & Video';
  return 'Desk & Peripherals';
}

export const CATEGORIES = [
  'All Products',
  'Desk & Peripherals',
  'Audio & Sound',
  'Power & Connectivity',
  'Displays & Video',
  'Wearables & Gear',
];
