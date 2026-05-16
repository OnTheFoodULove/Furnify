/**
 * mcpSkills.js
 * ─────────────────────────────────────────────────────────────────────────────
 * MCP Skills (Tools) for the Furnify Shopping Assistant
 *
 * Two parts per skill:
 *   1. TOOL DECLARATION  – the JSON schema sent to the AI so the model knows
 *                          what functions it can call and what params to pass.
 *   2. TOOL HANDLER      – the actual async function that queries Supabase
 *                          and returns a plain-object result.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';

// ─── 1. TOOL DECLARATIONS (MCP Tool Schema) ──────────────────────────────────

export const MCP_TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      'Search and filter furniture products by keyword, category, and/or maximum price. ' +
      'Returns a list of products with id, name, category, price, and description.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A keyword to search in the product name or description. Optional.',
        },
        category: {
          type: 'string',
          description:
            'Filter by category. One of: Living Room, Bedroom, Dining, Office, Outdoor. Optional.',
        },
        max_price: {
          type: 'number',
          description: 'Maximum price in Philippine Peso. Optional.',
        },
      },
      required: [],
    },
  },

  {
    name: 'get_product_details',
    description:
      'Get full details for a specific furniture product. ' +
      'Pass the product UUID (preferred) or the exact product name. ' +
      'Returns name, category, price, description, and image URL.',
    parameters: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'The UUID or exact name of the furniture product.',
        },
      },
      required: ['product_id'],
    },
  },

  {
    name: 'get_cart_summary',
    description:
      "Get the current user's shopping cart. Returns items with names, prices, quantities and total.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  {
    name: 'add_to_cart',
    description:
      'Add a furniture item to the cart. Pass the product UUID (preferred) or exact product name. ' +
      'Only call AFTER user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        product_id: {
          type: 'string',
          description: 'The UUID or exact name of the furniture product to add.',
        },
        quantity: {
          type: 'number',
          description: 'Number of units to add. Defaults to 1.',
        },
      },
      required: ['product_id'],
    },
  },

  {
    name: 'get_order_history',
    description:
      "Fetch the user's past orders sorted by most recent.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ─── 2. TOOL HANDLERS (MCP Skill Implementations) ────────────────────────────

/**
 * search_products — Query furniture table with optional filters
 */
async function skillSearchProducts({ query, category, max_price }) {
  try {
    let q = supabase
      .from('furniture')
      .select('id, name, category, price, description, image_url')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (category && category !== 'All') {
      q = q.eq('category', category);
    }
    if (max_price != null) {
      q = q.lte('price', max_price);
    }
    if (query) {
      q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;

    if (!data || data.length === 0) {
      return { found: false, message: 'No products matched the search criteria.' };
    }

    return {
      found: true,
      count: data.length,
      products: data.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description || 'No description available',
      })),
    };
  } catch (err) {
    console.error('[MCP:search_products]', err);
    return { found: false, message: 'Failed to search products. Please try again.' };
  }
}

/**
 * get_product_details — Fetch a single product by ID or name
 */
async function skillGetProductDetails({ product_id }) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let data, error;

    if (uuidRegex.test(product_id)) {
      // Lookup by UUID
      ({ data, error } = await supabase
        .from('furniture')
        .select('*')
        .eq('id', product_id)
        .eq('is_hidden', false)
        .single());
    } else {
      // Fallback: lookup by name (case-insensitive)
      ({ data, error } = await supabase
        .from('furniture')
        .select('*')
        .ilike('name', product_id)
        .eq('is_hidden', false)
        .single());
    }

    if (error || !data) {
      return { found: false, message: `Product "${product_id}" not found in our catalog.` };
    }

    return {
      found: true,
      product: {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        description: data.description || 'No description available',
        image_url: data.image_url,
      },
    };
  } catch (err) {
    console.error('[MCP:get_product_details]', err);
    return { found: false, message: 'Failed to fetch product details.' };
  }
}

/**
 * get_cart_summary — Fetch all cart items for the current user
 */
async function skillGetCartSummary(args, userId) {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity, furniture_id, furniture(id, name, price, category)')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { empty: true, message: 'Your cart is empty. Browse some furniture to add items!' };
    }

    const items = data.map((ci) => ({
      cart_item_id: ci.id,
      product_id: ci.furniture?.id || ci.furniture_id,
      name: ci.furniture?.name || 'Unknown item',
      category: ci.furniture?.category || '',
      price: ci.furniture?.price || 0,
      quantity: ci.quantity,
      subtotal: (ci.furniture?.price || 0) * ci.quantity,
    }));

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      empty: false,
      item_count: data.length,
      items,
      total,
    };
  } catch (err) {
    console.error('[MCP:get_cart_summary]', err);
    return { empty: true, message: 'Failed to fetch cart. Please try again.' };
  }
}

/**
 * add_to_cart — Insert or update a cart item
 */
async function skillAddToCart({ product_id, quantity = 1 }, userId) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let product, prodErr;

    if (uuidRegex.test(product_id)) {
      // Lookup by UUID
      ({ data: product, error: prodErr } = await supabase
        .from('furniture')
        .select('id, name, price')
        .eq('id', product_id)
        .eq('is_hidden', false)
        .single());
    } else {
      // Fallback: lookup by name (case-insensitive)
      ({ data: product, error: prodErr } = await supabase
        .from('furniture')
        .select('id, name, price')
        .ilike('name', product_id)
        .eq('is_hidden', false)
        .single());
    }

    if (prodErr || !product) {
      return { success: false, message: `Product "${product_id}" not found in our catalog.` };
    }

    // Use the resolved UUID from here on
    product_id = product.id;

    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('furniture_id', product_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);

      if (error) throw error;
      return {
        success: true,
        action: 'updated',
        message: `Updated "${product.name}" quantity to ${existing.quantity + quantity} in your cart.`,
      };
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, furniture_id: product_id, quantity });

      if (error) throw error;
      return {
        success: true,
        action: 'added',
        message: `Added "${product.name}" (₱${product.price.toLocaleString()}) to your cart!`,
      };
    }
  } catch (err) {
    console.error('[MCP:add_to_cart]', err);
    return { success: false, message: 'Failed to add item to cart. Please try again.' };
  }
}

/**
 * get_order_history — Fetch past orders for the current user
 */
async function skillGetOrderHistory(args, userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, delivery_address')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      // Table might not exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { found: false, message: 'No order history available yet. Start shopping! 🛒' };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return { found: false, message: 'No orders found. Time to start shopping! 🛒' };
    }

    return {
      found: true,
      count: data.length,
      orders: data.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total_amount,
        date: new Date(o.created_at).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        delivery_address: o.delivery_address,
      })),
    };
  } catch (err) {
    console.error('[MCP:get_order_history]', err);
    return { found: false, message: 'No order history available yet.' };
  }
}

// ─── 3. SKILL DISPATCHER ─────────────────────────────────────────────────────

/**
 * executeSkill — Routes a function call name + args to the right handler.
 * Called by the agent orchestrator after the model requests a tool call.
 * userId is passed separately so each handler gets the authenticated user.
 */
export async function executeSkill(skillName, args, userId) {
  console.log(`[MCP] Executing skill: ${skillName}`, args);

  switch (skillName) {
    case 'search_products':
      return await skillSearchProducts(args);
    case 'get_product_details':
      return await skillGetProductDetails(args);
    case 'get_cart_summary':
      return await skillGetCartSummary(args, userId);
    case 'add_to_cart':
      return await skillAddToCart(args, userId);
    case 'get_order_history':
      return await skillGetOrderHistory(args, userId);
    default:
      return { error: `Unknown skill: ${skillName}` };
  }
}
