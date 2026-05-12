/**
 * /api/clone-admin — クローンサーバー admin API プロキシ
 *
 * action=voice_url  : POST /api/admin/clients/{slug}/voice/url   (YouTube → Fish Audio)
 * action=voice_upload: POST /api/admin/clients/{slug}/voice/upload (ファイル → Fish Audio)
 * action=notebooklm : POST /api/admin/clients/{slug}/knowledge/notebooklm
 * action=create     : POST /api/admin/clients (クローン作成)
 *
 * 認証: CLONE_ADMIN_API_KEY env (クローンサーバーの require_api_key)
 */

import { NextRequest, NextResponse } from 'next/server';

const CLONE_SERVER_URL = process.env.CLONE_SERVER_URL || 'https://clone.kingjungobot.cloud';
const CLONE_ADMIN_API_KEY = process.env.CLONE_ADMIN_API_KEY || '';

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': CLONE_ADMIN_API_KEY,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!CLONE_ADMIN_API_KEY) {
    return NextResponse.json({ error: 'CLONE_ADMIN_API_KEY not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const slug = searchParams.get('slug') ?? '';

  try {
    const body = await req.json().catch(() => ({}));

    // ────── voice_url: YouTube から声クローン ──────
    if (action === 'voice_url') {
      if (!slug || !body.youtube_url) {
        return NextResponse.json({ error: 'slug and youtube_url required' }, { status: 400 });
      }
      const res = await fetch(`${CLONE_SERVER_URL}/api/admin/clients/${slug}/voice/url`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ url: body.youtube_url }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json(data, { status: res.status });
      return NextResponse.json({ ok: true, voice_id: data.voice_id });
    }

    // ────── notebooklm: NotebookLM URL 登録 ──────
    if (action === 'notebooklm') {
      if (!slug || !body.url) {
        return NextResponse.json({ error: 'slug and url required' }, { status: 400 });
      }
      const res = await fetch(`${CLONE_SERVER_URL}/api/admin/clients/${slug}/knowledge/notebooklm`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ url: body.url, force: body.force ?? false }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json(data, { status: res.status });
      return NextResponse.json({ ok: true });
    }

    // ────── create: クローンサーバーに直接作成 ──────
    if (action === 'create') {
      const res = await fetch(`${CLONE_SERVER_URL}/api/admin/clients`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json(data, { status: res.status });
      return NextResponse.json({ ok: true, ...data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[clone-admin]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
