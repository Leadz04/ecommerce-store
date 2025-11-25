import { NextResponse } from 'next/server';
import { companyInfo } from '@/data/companyInfo';

export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const items = [
    {
      title: 'Hello World',
      link: `${site}/blog/hello-world`,
      description: 'Getting started with our new blog.',
      pubDate: new Date().toUTCString(),
      guid: `${site}/blog/hello-world`,
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${companyInfo.name} Journal</title>
    <link>${site}</link>
    <description>Insights, launch news, and styling tips from ${companyInfo.name}</description>
    ${items
      .map(
        (item) => `
    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}


