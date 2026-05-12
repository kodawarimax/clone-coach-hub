/**
 * GET   /api/clones/:slug  — 詳細取得 (profile.json 全フィールド、機密は REDACT)
 * PATCH /api/clones/:slug  — profile.json 編集 (system_prompt 等編集可、機密フィールドは除外)
 *
 * セキュリティ:
 *  - slug は ^[a-z][a-z0-9_-]*$ バリデーション必須
 *  - Path traversal 防止 (safeClientDir)
 *  - 機密フィールドは GET で [REDACTED]、PATCH で書込禁止
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  readProfile,
  redactProfile,
  safeClientDir,
  appendLog,
  CLIENTS_DIR,
} from '../clones-utils';

export const dynamic = 'force-dynamic';

// PATCH で書き込みを許可するフィールド
const PATCH_ALLOWED_FIELDS = new Set([
  'display_name', 'system_prompt', 'model', 'language', 'description',
  'specialties', 'featured', 'fish_audio_voice_id', 'fish_audio_model',
  'gemini_voice', 'use_platform_keys', 'notebooklm_notebook_urls',
  'roles', 'primary_brand_assignment', 'copywriting_specialties',
]);

// PATCH で書き込みを禁止するフィールド (機密)
const PATCH_FORBIDDEN_FIELDS = new Set([
  'line_channel_secret', 'line_channel_access_token',
  'fish_audio_api_key', 'gemini_api_key',
  'name', // slug と一致させる必要があるため変更禁止
]);

// ======================================================
// GET /api/clones/:slug
// ======================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const { slug } = params;

  const clientDir = safeClientDir(slug);
  if (!clientDir) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const profile = await readProfile(slug);
  if (!profile) {
    return NextResponse.json({ error: `Clone '${slug}' not found` }, { status: 404 });
  }

  // 詳細取得では listOnly=false (全フィールド返すが機密は REDACT)
  const safeProfile = redactProfile(profile, false);

  return NextResponse.json({ slug, profile: safeProfile });
}

// ======================================================
// PATCH /api/clones/:slug
// ======================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const { slug } = params;

  const clientDir = safeClientDir(slug);
  if (!clientDir) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const profile = await readProfile(slug);
  if (!profile) {
    return NextResponse.json({ error: `Clone '${slug}' not found` }, { status: 404 });
  }

  let updates: Record<string, unknown>;
  try {
    updates = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 禁止フィールドチェック
  const forbidden = Object.keys(updates).filter(k => PATCH_FORBIDDEN_FIELDS.has(k));
  if (forbidden.length > 0) {
    return NextResponse.json({
      error: `Fields not editable via API: ${forbidden.join(', ')}`,
    }, { status: 403 });
  }

  // 許可フィールドのみ適用
  const allowed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (PATCH_ALLOWED_FIELDS.has(k)) {
      allowed[k] = v;
    }
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = { ...profile, ...allowed };
  const profilePath = path.join(CLIENTS_DIR, slug, 'profile.json');
  await fs.writeFile(profilePath, JSON.stringify(updated, null, 2), 'utf8');

  await appendLog({ action: 'patch', slug, fields: Object.keys(allowed) });

  return NextResponse.json({
    success: true,
    slug,
    updated_fields: Object.keys(allowed),
  });
}
