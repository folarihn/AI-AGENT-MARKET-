import React from 'react';
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';
  return raw.replace(/\/+$/, '');
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const origin = url.origin || siteUrl();

  const agentRes = await fetch(`${origin}/api/agents/slug/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!agentRes.ok) {
    return new Response('Not found', { status: 404 });
  }
  const agentData = await agentRes.json();
  const agent = agentData.agent as { displayName: string; creatorName: string; price: number };
  const rating = Number(agentData.averageRating || 0);
  const count = Number(agentData.reviewCount || 0);

  const price = agent.price === 0 ? 'Free' : `$${agent.price}`;
  const ratingText = count > 0 ? `${rating.toFixed(1)} / 5` : 'No ratings';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #312e81 100%)',
          color: '#ffffff',
          padding: '64px',
          fontFamily: 'Inter, ui-sans-serif, system-ui',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '860px' }}>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>{agent.displayName}</div>
            <div style={{ fontSize: 28, opacity: 0.9 }}>by {agent.creatorName}</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '12px 16px',
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#10b981',
              }}
            />
            Verified by Agenti
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: 28, opacity: 0.9 }}>{ratingText}</div>
            <div style={{ fontSize: 22, opacity: 0.75 }}>{count} reviews</div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 800 }}>{price}</div>
            <div style={{ fontSize: 20, opacity: 0.8 }}>agenti.market</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

