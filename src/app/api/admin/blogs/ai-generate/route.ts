import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import Blog from '@/models/Blog';

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const body = await request.json();
    const { title, description = '', category = '' } = body || {};
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    // Fetch a handful of products to ground the content
    const query: any = { isActive: true };
    if (category) query.category = category;
    const products = await Product.find(query).sort({ rating: -1, createdAt: -1 }).limit(12).lean();

    // Build a brief product context for the model
    const productBullets = products
      .map((p: any) => `- ${p.name} (${p.category || ''}) — $${Number(p.price || 0).toFixed(2)}${p.description ? `: ${p.description.slice(0, 140)}...` : ''}`)
      .join('\n');

    const basePrompt = `You are an e-commerce content writer. Write an SEO-optimized blog article, using <h1>, <h2>, <h3>, <p>, and <ul>/<li>. Keep tone practical, detailed, and helpful. Do not invent products; if you reference products, speak generally. give the output in HTML format.

Title: ${title}
Short description: ${description}
Category: ${category || 'General'}

Products snapshot (context only, do not list SKU details):\n${productBullets}

Minimum depth requirement:
- For EACH product listed in the snapshot, add a dedicated subsection (~120–180 words) that explains 1) who it’s for, 2) usage scenario, 3) styling/fit or benefits, and 4) a quick tip for care or pairing. Use <h3> for each product subsection heading.

Output requirements:
- Start with <h1> for the title, then a rich intro paragraph (4–6 sentences).
- Add 5–8 thematic <h2> sections (e.g., tips, use-cases), each with helpful paragraphs and bullet points.
- Under relevant <h2> sections, include the product subsections (<h3> + paragraph(s)) so total reading time reaches at least 1 minute per product.
- Overall length target: 1500–3000 words depending on the number of products.
- End with a conclusion and a clear CTA to browse the related category.
`;

    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    let contentHtml = '';

    // Prefer Gemini if provided (fast, low-cost), fallback to OpenAI
    if (geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: basePrompt }]
              }
            ],
            generationConfig: { temperature: 0.7 }
          })
        });
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Gemini response:', text);
        if (res.ok && text) contentHtml = text;
      } catch (_) {}
    }

    if (!contentHtml && openaiKey) {
      // Use OpenAI SDK lightly without adding heavy deps by calling fetch
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful e-commerce content writer.' },
            { role: 'user', content: basePrompt }
          ],
          temperature: 0.7,
        })
      });
      const data = await res.json();
      if (res.ok && data?.choices?.[0]?.message?.content) {
        contentHtml = data.choices[0].message.content;
      }
    }

    // Fallback simple template if no API key or model failed
    if (!contentHtml) {
      contentHtml = `
        <h1>${title}</h1>
        <p>${description || 'Explore practical tips and ideas from our collection.'}</p>
        <h2>Getting Started</h2>
        <p>Here are practical steps to begin. Keep your setup simple and focused on everyday use.</p>
        <h2>Editor Picks</h2>
        <ul>
          ${products.slice(0,6).map((p: any) => `<li>${p.name} — $${Number(p.price||0).toFixed(2)}</li>`).join('')}
        </ul>
        <h2>How to Choose</h2>
        <p>Match items to lifestyle, budget, and longevity. Opt for neutral colors and durable materials.</p>
        <h2>Care & Maintenance</h2>
        <p>Basic care extends product lifespan and keeps them looking great.</p>
        <h2>Conclusion</h2>
        <p>Ready to explore more? Browse our ${category || 'latest'} collection.</p>
      `;
    }

    let slug = toSlug(title);
    // Ensure unique slug by suffixing -2, -3, ... if needed
    if (await Blog.findOne({ slug })) {
      let i = 2;
      while (await Blog.findOne({ slug: `${slug}-${i}` })) i += 1;
      slug = `${slug}-${i}`;
    }

    const blog = await Blog.create({
      title,
      slug,
      description: description?.slice(0, 200) || '',
      contentHtml,
      tags: [category?.toLowerCase()].filter(Boolean),
      status: 'published',
      publishAt: new Date(),
      isActive: true,
      isDeleted: false,
    });

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error('AI generate blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


