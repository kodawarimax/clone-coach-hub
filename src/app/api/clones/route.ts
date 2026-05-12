/**
 * GET  /api/clones  — クローン一覧 + 死活情報
 * POST /api/clones  — 新規クローン作成 (mkdir + profile.json)
 *
 * セキュリティ:
 *  - profile.json の機密フィールドは [REDACTED] 置換して返却
 *  - slug は ^[a-z][a-z0-9_-]*$ のみ許可 (Path traversal 防止)
 *  - line_channel_secret / fish_audio_api_key / gemini_api_key は常に REDACT
 *  - 操作ログ: ~/.keiei_taku/clones-actions.log に append-only
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  CLIENTS_DIR, VPS_HOST, EXCLUDE_DIRS, SLUG_RE,
  redactProfile, appendLog, readProfile, safeClientDir,
} from './clones-utils';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

/** VPS で manage.sh status を実行して稼働情報を取得 */
async function fetchVpsStatus(): Promise<Record<string, string>> {
  try {
    const { stdout } = await execFileAsync('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=5',
      '-o', 'BatchMode=yes',
      `root@${VPS_HOST}`,
      'bash /root/clone/manage.sh status 2>/dev/null || echo "STATUS_UNAVAILABLE"',
    ], { timeout: 8000 });

    const result: Record<string, string> = {};
    for (const line of stdout.split('\n')) {
      const m = line.match(/^([a-z][a-z0-9_-]+)\s*:\s*(online|offline|running|stopped|error)/i);
      if (m) result[m[1]] = m[2].toLowerCase();
    }
    return result;
  } catch {
    return {};
  }
}

// ======================================================
// GET /api/clones
// ======================================================
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    const slugs = entries
      .filter(e => e.isDirectory() && !EXCLUDE_DIRS.has(e.name) && SLUG_RE.test(e.name))
      .map(e => e.name);

    const vpsStatusPromise = fetchVpsStatus();

    const profiles = await Promise.all(
      slugs.map(async (slug) => {
        const profile = await readProfile(slug);
        if (!profile) return null;
        return { slug, profile: redactProfile(profile, true) };
      })
    );

    const vpsStatus = await vpsStatusPromise;

    const clones = profiles
      .filter(Boolean)
      .map(item => {
        const { slug, profile } = item!;
        const status = vpsStatus[slug] ?? 'unknown';
        return { slug, status, ...profile };
      });

    return NextResponse.json({ clones, total: clones.length });
  } catch (err) {
    console.error('[GET /api/clones]', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

// ======================================================
// POST /api/clones — 新規クローン作成
// ======================================================
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      slug: string;
      display_name: string;
      persona: string;
      model?: string;
      description?: string;
      knowledge_urls?: string[];
      specialties?: string[];
      fish_audio_voice_id?: string;
      voice_source_url?: string;
      google_drive_url?: string;
    };

    const {
      slug, display_name, persona,
      model = 'gemini-2.5-flash',
      description = '',
      knowledge_urls = [],
      specialties = [],
      fish_audio_voice_id = '',
      voice_source_url = '',
      google_drive_url = '',
    } = body;

    if (!slug || !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug. Must match ^[a-z][a-z0-9_-]*$' }, { status: 400 });
    }
    if (EXCLUDE_DIRS.has(slug)) {
      return NextResponse.json({ error: 'Reserved slug name' }, { status: 400 });
    }
    if (!display_name || !persona) {
      return NextResponse.json({ error: 'display_name and persona are required' }, { status: 400 });
    }

    const clientDir = safeClientDir(slug);
    if (!clientDir) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    try {
      await fs.access(clientDir);
      return NextResponse.json({ error: `Clone '${slug}' already exists` }, { status: 409 });
    } catch { /* 存在しない = OK */ }

    await fs.mkdir(clientDir, { recursive: true });

    const profile = {
      name: slug,
      display_name,
      system_prompt: persona,
      model,
      language: 'ja',
      description,
      notebooklm_notebook_urls: knowledge_urls,
      fish_audio_voice_id,
      fish_audio_model: 's2-pro',
      fish_audio_latency: 'low',
      line_channel_secret: '',
      line_channel_access_token: '',
      use_platform_keys: true,
      specialties,
      featured: false,
      ...(voice_source_url && { voice_source_url }),
      ...(google_drive_url && { google_drive_url }),
    };

    await fs.writeFile(
      path.join(clientDir, 'profile.json'),
      JSON.stringify(profile, null, 2),
      'utf8'
    );

    await appendLog({ action: 'create', slug, display_name, model });

    return NextResponse.json({
      success: true,
      slug,
      message: `Clone '${slug}' created. Deploy separately after じゅんごさん approval.`,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/clones]', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

