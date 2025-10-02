import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import Blog from '@/models/Blog';
import { createJob, getJob } from '@/lib/jobs';

function buildPrompt(title: string, description: string, category: string, productBullets: string, minWords: number) {
  return `You are an e-commerce content writer. Produce a LONG, SEO-optimized blog article. Tone: practical and detailed. Do not fabricate products. give the output in HTML format.

Title: ${title}
Short description: ${description}
Category: ${category || 'General'}

Products snapshot (context only):\n${productBullets}


Depth requirement:
- Add a dedicated <h3> subsection for EACH product: audience, use-case, benefits/styling, and a care/pairing tip.
- 5–8 thematic <h2> sections with helpful tips and scannable lists.
- Rich intro (4–6 sentences) and a clear CTA conclusion.
`;
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    const { category = '', minWords = 2000, limit = 50 } = body || {};

    const blogs = await Blog.find({ isDeleted: false }).sort({ updatedAt: -1 }).limit(limit).lean();
    if (!blogs.length) return NextResponse.json({ success: true, jobId: null, updated: 0 });

    const job = createJob(async () => {
      const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      let updated = 0;
      // Run all blog generations in parallel batches
      await Promise.all(
        blogs.map(async (b) => {
          try {
            const categoryHint = category || (b.tags?.[0] || 'General');
            const q: any = { isActive: true };
            if (categoryHint && categoryHint !== 'General') q.category = categoryHint;
            const products = await Product.find(q).sort({ rating: -1, createdAt: -1 }).limit(20).lean();
            const productBullets = products.map((p: any) => `- ${p.name} (${p.category || ''}) — $${Number(p.price||0).toFixed(2)}${p.description?`: ${p.description.slice(0,140)}...`:''}`).join('\n');
            const prompt = buildPrompt(b.title, b.description || '', categoryHint, productBullets, minWords);

            let contentHtml = '';
            if (geminiKey) {
              try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } })
                });
                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (res.ok && text) contentHtml = text;
              } catch (_) {}
            }
            if (!contentHtml && openaiKey) {
              try {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST', headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({
                    model: 'gpt-4o-mini', temperature: 0.7, messages: [
                      { role: 'system', content: 'You are a helpful e-commerce content writer.' },
                      { role: 'user', content: prompt }
                    ]
                  })
                });
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (res.ok && text) contentHtml = text;
              } catch (_) {}
            }

            if (!contentHtml) return;
            await Blog.updateOne({ _id: b._id }, { $set: { contentHtml } });
            updated += 1;
          } catch (_) {}
        })
      );
      return { updated };
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error('AI regenerate all blogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('jobId') || '';
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}


