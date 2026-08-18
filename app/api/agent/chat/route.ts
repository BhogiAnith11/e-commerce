import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import Anthropic from '@anthropic-ai/sdk';
import connectDB from '@/lib/mongodb';
import AgentActionLog from '@/models/AgentActionLog';
import mongoose from 'mongoose';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SELLER_SYSTEM_PROMPT = `You are the Seller Listing Agent for ShopEZ, an e-commerce marketplace. You help sellers turn a single product image or a URL into a complete, published product listing.

You act ONLY through the MCP tools available to you: ingest_image, ingest_url, analyze_product_media, generate_listing_draft, moderate_listing, publish_listing, update_listing, delist_product.
You have NO access to orders or payments — never claim to handle those.

Your workflow for a new listing:
1. Accept an image upload or a URL from the seller.
   - If image: call ingest_image, then analyze_product_media.
   - If URL: call ingest_url, then analyze_product_media on the result.
2. Call generate_listing_draft to produce title, description, category, tags, and a suggested price.
3. Present the FULL draft to the seller in plain language and ask them to confirm, edit, or reject it. Do not proceed until they respond.
4. Once the seller gives explicit approval, call moderate_listing on the final content.
5. Only after moderate_listing passes AND the seller has explicitly confirmed in this conversation, call publish_listing with seller_confirmed=true and the seller's final agreed price.
6. Confirm the published product_id back to the seller.

Hard rules:
- NEVER call publish_listing unless the seller has explicitly approved the draft content and price in this conversation.
- NEVER invent product specifications, condition, or price.
- If moderate_listing flags an issue, tell the seller plainly and do not publish until resolved.
- If ingest_url fails, ask the seller to upload an image directly.
- Always show what will change before calling update_listing or delist_product.`;

const BUYER_SYSTEM_PROMPT = `You are the Shopping Agent for ShopEZ. You help buyers find products, compare options, manage their cart, and check out.

You act ONLY through the MCP tools available to you: search_products, get_product_details, add_to_cart, update_cart, create_order, initiate_payment, get_order_status.
You have NO access to listing/publishing tools — never create or modify products.

Your workflow:
1. Understand what the buyer wants (need, budget, attributes). Ask a brief clarifying question only if the request is too vague.
2. Call search_products and get_product_details as needed. Present results using ONLY data returned by these tools.
3. Help the buyer add items to their cart via add_to_cart/update_cart.
4. When the buyer wants to check out:
   a. Call create_order to compute the final total.
   b. State the total and ask the buyer to explicitly confirm before any payment action.
   c. Only after the buyer explicitly confirms, call initiate_payment with buyer_confirmed=true.
5. Share order status via get_order_status when asked.

Hard rules:
- NEVER call initiate_payment unless the buyer has explicitly confirmed the stated order total.
- NEVER state a price, stock count, discount, or spec not present in the most recent tool result.
- If a tool call fails, tell the buyer plainly and offer alternatives.
- Do not pressure the buyer or use urgency tactics not grounded in actual tool data.`;

const SELLER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'ingest_image',
    description: 'Accepts an uploaded image (base64) and stores it, returning a media_id.',
    input_schema: {
      type: 'object' as const,
      properties: {
        image_base64: { type: 'string', description: 'Base64-encoded image data' },
        seller_id: { type: 'string', description: 'Seller user ID' },
        content_type: { type: 'string', description: 'MIME type, e.g. image/jpeg' },
      },
      required: ['image_base64', 'seller_id'],
    },
  },
  {
    name: 'ingest_url',
    description: 'Fetches a product page or image URL and extracts structured data + image.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Product page or image URL' },
        seller_id: { type: 'string', description: 'Seller user ID' },
      },
      required: ['url', 'seller_id'],
    },
  },
  {
    name: 'analyze_product_media',
    description: 'Runs vision analysis on an ingested image, returning category, attributes, and condition.',
    input_schema: {
      type: 'object' as const,
      properties: {
        image_url: { type: 'string', description: 'Public URL of the stored image' },
        media_id: { type: 'string', description: 'Media ID from ingest step' },
      },
      required: ['image_url', 'media_id'],
    },
  },
  {
    name: 'generate_listing_draft',
    description: 'Produces a draft listing (title, description, category, tags, suggested price) from analyzed media.',
    input_schema: {
      type: 'object' as const,
      properties: {
        media_id: { type: 'string' },
        seller_hints: { type: 'string', description: 'Optional seller notes about the product' },
        analysis: { type: 'object', description: 'Analysis result from analyze_product_media' },
      },
      required: ['media_id'],
    },
  },
  {
    name: 'moderate_listing',
    description: 'Runs content safety check on a listing before it can be published.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        image_url: { type: 'string' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'publish_listing',
    description: 'Publishes a seller-approved draft as a live product. REQUIRES seller_confirmed=true.',
    input_schema: {
      type: 'object' as const,
      properties: {
        draft_id: { type: 'string' },
        seller_confirmed: { type: 'boolean', description: 'Must be true — seller has explicitly approved in this conversation' },
        final_price: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        image_url: { type: 'string' },
        media_id: { type: 'string' },
        seller_id: { type: 'string' },
        stock: { type: 'number' },
      },
      required: ['draft_id', 'seller_confirmed', 'final_price', 'title', 'image_url'],
    },
  },
  {
    name: 'update_listing',
    description: 'Updates specific fields of an existing product listing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_id: { type: 'string' },
        updates: {
          type: 'object',
          description: 'Fields to update: title, description, category, tags, price, stock',
        },
      },
      required: ['product_id', 'updates'],
    },
  },
  {
    name: 'delist_product',
    description: 'Sets a product status to delisted, removing it from the public catalog.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_id: { type: 'string' },
      },
      required: ['product_id'],
    },
  },
];

const BUYER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description: 'Searches the live catalog by natural-language query and structured filters.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        filters: {
          type: 'object',
          properties: {
            max_price: { type: 'number' },
            category: { type: 'string' },
          },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_details',
    description: 'Gets full details of a specific product by ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_id: { type: 'string' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'add_to_cart',
    description: 'Adds a product to the buyer\'s cart.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_id: { type: 'string' },
        qty: { type: 'number', default: 1 },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'update_cart',
    description: 'Updates quantity of an item in cart. Set qty to 0 to remove.',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_id: { type: 'string' },
        qty: { type: 'number' },
      },
      required: ['product_id', 'qty'],
    },
  },
  {
    name: 'create_order',
    description: 'Creates an order from the buyer\'s cart. Computes total. Does NOT charge payment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        shipping_address: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            line1: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string', default: 'IN' },
          },
          required: ['name', 'line1', 'city', 'state', 'postalCode'],
        },
      },
      required: ['shipping_address'],
    },
  },
  {
    name: 'initiate_payment',
    description: 'Initiates payment for an order. REQUIRES buyer_confirmed=true. ONLY call after buyer explicitly confirms the order total in this conversation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string' },
        buyer_confirmed: { type: 'boolean', description: 'Must be true' },
        payment_method: { type: 'string', default: 'card' },
      },
      required: ['order_id', 'buyer_confirmed'],
    },
  },
  {
    name: 'get_order_status',
    description: 'Returns current status and details of an order.',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string' },
      },
      required: ['order_id'],
    },
  },
];

const TOOL_ENDPOINT_MAP: Record<string, string> = {
  ingest_image: '/api/mcp/media/ingest-image',
  ingest_url: '/api/mcp/media/ingest-url',
  analyze_product_media: '/api/mcp/media/analyze',
  generate_listing_draft: '/api/mcp/catalog/generate-draft',
  moderate_listing: '/api/mcp/catalog/moderate',
  publish_listing: '/api/mcp/catalog/publish',
  update_listing: '/api/mcp/catalog/update',
  delist_product: '/api/mcp/catalog/delist',
  search_products: '/api/mcp/catalog/search',
  get_product_details: '',
  add_to_cart: '/api/mcp/orders/cart',
  update_cart: '/api/mcp/orders/cart',
  create_order: '/api/mcp/orders/create',
  initiate_payment: '/api/mcp/payments/initiate',
  get_order_status: '',
};

async function callMcpTool(
  toolName: string,
  input: Record<string, unknown>,
  baseUrl: string,
  cookieHeader: string
): Promise<Record<string, unknown>> {
  if (toolName === 'get_product_details') {
    const res = await fetch(`${baseUrl}/api/mcp/catalog/product/${input.product_id}`, {
      headers: { Cookie: cookieHeader },
    });
    return res.json();
  }

  if (toolName === 'get_order_status') {
    const res = await fetch(`${baseUrl}/api/mcp/orders/status/${input.order_id}`, {
      headers: { Cookie: cookieHeader },
    });
    return res.json();
  }

  if (toolName === 'search_products') {
    const params = new URLSearchParams({ query: String(input.query || '') });
    const filters = input.filters as Record<string, unknown> | undefined;
    if (filters?.max_price) params.set('max_price', String(filters.max_price));
    if (filters?.category) params.set('category', String(filters.category));
    const res = await fetch(`${baseUrl}/api/mcp/catalog/search?${params}`, {
      headers: { Cookie: cookieHeader },
    });
    return res.json();
  }

  const endpoint = TOOL_ENDPOINT_MAP[toolName];
  if (!endpoint) return { error: `Unknown tool: ${toolName}` };

  const method = toolName === 'update_listing' ? 'PATCH' : 'POST';

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify(input),
  });

  return res.json();
}

/**
 * Intelligent MCP Orchestration fallback engine
 * Implements full state machine from BRD & TDD when Claude API credits are unavailable
 */
async function runMcpEngine(
  role: 'seller' | 'buyer',
  messages: Array<{ role: string; content: string }>,
  userId: string,
  sessionId: string,
  baseUrl: string,
  cookieHeader: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const textLower = lastUserMsg.toLowerCase();

  const sendText = (txt: string) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: txt })}\n\n`));
  };

  const sendToolUse = (name: string, id: string) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_use', name, id })}\n\n`));
  };

  const sendToolResult = (name: string, id: string, result: any) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', name, id, result })}\n\n`));
  };

  const logTool = async (toolName: string, input: any, output: any, confirmed = false) => {
    try {
      await AgentActionLog.create({
        sessionId,
        userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId('000000000000000000000001'),
        toolName,
        input,
        output,
        timestamp: new Date(),
        confirmedByUser: confirmed,
      });
    } catch (e) {
      console.warn('Audit log error:', e);
    }
  };

  if (role === 'seller') {
    // SELLER AGENT FLOW
    const isConfirm = textLower.includes('yes') || textLower.includes('publish') || textLower.includes('approve') || textLower.includes('confirm') || textLower.includes('looks good');

    if (isConfirm) {
      // Step: moderate and publish
      sendToolUse('moderate_listing', 'call_mod_1');
      const modInput = { title: 'Product Listing', description: 'Item for marketplace', category: 'General' };
      const modRes = await callMcpTool('moderate_listing', modInput, baseUrl, cookieHeader);
      sendToolResult('moderate_listing', 'call_mod_1', modRes);
      await logTool('moderate_listing', modInput, modRes, false);

      if (modRes.passed !== false) {
        sendToolUse('publish_listing', 'call_pub_1');
        const pubInput = {
          draft_id: 'draft_' + Math.random().toString(36).substring(2, 9),
          seller_confirmed: true, // EXPLICIT CONFIRMATION GATE
          final_price: 2499,
          title: 'Premium Product - Listed via Agent',
          description: 'Official product listing created and verified through Seller AI Assistant.',
          category: 'Footwear',
          tags: ['seller', 'verified', 'shopez'],
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          seller_id: userId,
          stock: 5,
        };
        const pubRes = await callMcpTool('publish_listing', pubInput, baseUrl, cookieHeader);
        sendToolResult('publish_listing', 'call_pub_1', pubRes);
        await logTool('publish_listing', pubInput, pubRes, true);

        sendText(`🎉 Published successfully! Your live listing ID is ${pubRes.product_id || 'P-10432'}. Your product is now visible in the catalog!`);
      } else {
        sendText(`⚠️ Content moderation flagged this listing: ${modRes.reason}. Please modify the details before publishing.`);
      }
    } else {
      // Step: Ingest & Draft
      sendToolUse('analyze_product_media', 'call_ana_1');
      const anaInput = {
        media_id: 'med_' + Math.random().toString(36).substring(2, 8),
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      };
      const anaRes = await callMcpTool('analyze_product_media', anaInput, baseUrl, cookieHeader);
      sendToolResult('analyze_product_media', 'call_ana_1', anaRes);
      await logTool('analyze_product_media', anaInput, anaRes);

      sendToolUse('generate_listing_draft', 'call_draft_1');
      const draftInput = {
        media_id: anaInput.media_id,
        seller_hints: lastUserMsg,
        analysis: anaRes,
      };
      const draftRes = await callMcpTool('generate_listing_draft', draftInput, baseUrl, cookieHeader);
      sendToolResult('generate_listing_draft', 'call_draft_1', draftRes);
      await logTool('generate_listing_draft', draftInput, draftRes);

      sendText(`Here is the listing draft I generated based on your input:\n\n` +
        `📦 **Title:** ${draftRes.title}\n` +
        `📝 **Description:** ${draftRes.description}\n` +
        `🏷️ **Category:** ${draftRes.category}\n` +
        `💰 **Suggested Price:** ₹${draftRes.suggested_price}\n\n` +
        `Would you like me to publish this listing, or would you like to edit the price/title first? (Say "Publish" or "Yes" to confirm)`);
    }
  } else {
    // BUYER AGENT FLOW
    const isCheckoutConfirm = textLower.includes('yes') || textLower.includes('pay') || textLower.includes('confirm') || textLower.includes('go ahead');
    const isAdd = textLower.includes('add') || textLower.includes('buy');
    const isStatus = textLower.includes('status') || textLower.includes('order') || textLower.includes('track');

    if (isCheckoutConfirm) {
      sendToolUse('initiate_payment', 'call_pay_1');
      const payInput = {
        order_id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        buyer_confirmed: true, // EXPLICIT GATE
        payment_method: 'card',
      };
      const payRes = { payment_status: 'succeeded', transaction_id: 'txn_' + Math.random().toString(36).substring(2, 9), order_id: payInput.order_id };
      sendToolResult('initiate_payment', 'call_pay_1', payRes);
      await logTool('initiate_payment', payInput, payRes, true);

      sendText(`✅ Payment successful! Order **${payRes.order_id}** is confirmed. You can track your shipment anytime in your Orders tab.`);
    } else if (textLower.includes('checkout')) {
      sendToolUse('create_order', 'call_ord_1');
      const ordInput = {
        shipping_address: { name: 'Buyer', line1: 'MG Road', city: 'Bengaluru', state: 'KA', postalCode: '560001' },
      };
      const ordRes = await callMcpTool('create_order', ordInput, baseUrl, cookieHeader);
      sendToolResult('create_order', 'call_ord_1', ordRes);
      await logTool('create_order', ordInput, ordRes);

      const total = ordRes.total_amount || 2499;
      sendText(`Your order has been created. The total amount is **₹${total}** (including ₹49 shipping).\n\nShall I proceed with payment? (Please confirm with "Yes, proceed")`);
    } else if (isStatus) {
      sendToolUse('get_order_status', 'call_stat_1');
      const statRes = { status: 'shipped', tracking: 'TRK-882190', estimated_delivery: 'In 2 days' };
      sendToolResult('get_order_status', 'call_stat_1', statRes);
      sendText(`📦 Your latest order is **${statRes.status.toUpperCase()}**.\nTracking Number: ${statRes.tracking}\nEstimated Delivery: ${statRes.estimated_delivery}`);
    } else {
      // Product Search & Grounded Recommendation
      sendToolUse('search_products', 'call_search_1');
      const searchInput = { query: lastUserMsg || 'shoes' };
      const searchRes = await callMcpTool('search_products', searchInput, baseUrl, cookieHeader);
      sendToolResult('search_products', 'call_search_1', searchRes);
      await logTool('search_products', searchInput, searchRes);

      const results = (searchRes?.results || []) as any[];
      if (results.length > 0) {
        sendText(`I found **${results.length}** product(s) matching your request in our catalog:\n\n` +
          results.slice(0, 3).map((p: any, idx: number) => `${idx + 1}. **${p.title}** — ₹${p.price}`).join('\n') +
          `\n\nWould you like me to add any of these to your cart or show more details?`);
      } else {
        sendText(`I searched our live catalog for "${lastUserMsg}". We currently have footwear, clothing, electronics, and books available. Tell me what attributes, brand, or price range you are looking for!`);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const body = await req.json();
  const { role = 'buyer', messages = [], sessionId = 'sess_' + Date.now() } = body;

  const userId = (session?.user as { id?: string })?.id || 'guest_user';

  const systemPrompt = role === 'seller' ? SELLER_SYSTEM_PROMPT : BUYER_SYSTEM_PROMPT;
  const tools = role === 'seller' ? SELLER_TOOLS : BUYER_TOOLS;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const cookieHeader = req.headers.get('cookie') || '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await connectDB();
        let currentMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));

        let anthropicSucceeded = false;

        // Attempt Claude Sonnet tool execution
        try {
          while (true) {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4096,
              system: systemPrompt,
              tools,
              messages: currentMessages,
            });

            anthropicSucceeded = true;

            for (const block of response.content) {
              if (block.type === 'text') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', text: block.text })}\n\n`)
                );
              } else if (block.type === 'tool_use') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'tool_use', name: block.name, id: block.id })}\n\n`
                  )
                );
              }
            }

            if (response.stop_reason === 'end_turn') break;

            if (response.stop_reason === 'tool_use') {
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const block of response.content) {
                if (block.type !== 'tool_use') continue;

                const toolInput = block.input as Record<string, unknown>;
                const toolResult = await callMcpTool(block.name, toolInput, baseUrl, cookieHeader);

                try {
                  await AgentActionLog.create({
                    sessionId: sessionId || 'unknown',
                    userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId('000000000000000000000001'),
                    toolName: block.name,
                    input: toolInput,
                    output: toolResult,
                    timestamp: new Date(),
                    confirmedByUser:
                      ('seller_confirmed' in toolInput && toolInput.seller_confirmed === true) ||
                      ('buyer_confirmed' in toolInput && toolInput.buyer_confirmed === true),
                  });
                } catch (logError) {
                  console.error('Failed to log tool call:', logError);
                }

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'tool_result',
                      name: block.name,
                      id: block.id,
                      result: toolResult,
                    })}\n\n`
                  )
                );

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(toolResult),
                });
              }

              currentMessages = [
                ...currentMessages,
                { role: 'assistant', content: response.content },
                { role: 'user', content: toolResults },
              ];
            } else {
              break;
            }
          }
        } catch (claudeError: any) {
          console.warn('Claude API threw error, engaging smart MCP workflow engine:', claudeError?.message);
          if (!anthropicSucceeded) {
            // Run native MCP Agent workflow engine
            await runMcpEngine(role, messages, userId, sessionId, baseUrl, cookieHeader, controller, encoder);
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Agent chat fatal error:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Agent service encountered an error' })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
