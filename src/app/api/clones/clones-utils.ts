/**
 * clones-utils.ts — クローン API 共有ユーティリティ
 * route.ts から抽出。Next.js Route export 制約を回避するため別ファイルに配置。
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const CLIENTS_DIR = process.env.CLONE_CLIENTS_DIR
  ?? path.join(os.homedir(), 'Claude', 'Service', 'Clone', 'clients');
export const LOG_DIR  = process.env.CLONE_LOG_DIR ?? path.join(os.homedir(), '.keiei_taku');
export const LOG_FILE = path.join(LOG_DIR, 'clones-actions.log');
export const VPS_HOST = process.env.CLONE_VPS_HOST ?? '72.61.119.101';

export const EXCLUDE_DIRS = new Set([
  '_archive', '_template', 'check_prompt', 'verify_prompt', 'verify_test',
  'test_client', 'test_client_001', 'test_ryusen', 'test_verify_full',
  'tokens.json',
]);

export const SLUG_RE = /^[a-z][a-z0-9_-]*$/;

const SECRET_FIELDS = new Set([
  'line_channel_secret',
  'line_channel_access_token',
  'fish_audio_api_key',
  'gemini_api_key',
  'system_prompt',
]);

const LIST_SAFE_FIELDS = new Set([
  'name', 'display_name', 'description', 'model', 'language',
  'specialties', 'featured', 'roles', 'primary_brand_assignment',
  'fish_audio_model', 'gemini_voice', 'use_platform_keys',
  'notebooklm_notebook_urls',
]);

export function redactProfile(profile: Record<string, unknown>, listOnly = false): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(profile)) {
    if (listOnly && !LIST_SAFE_FIELDS.has(k)) continue;
    // 詳細取得 (listOnly=false) では system_prompt はそのまま返す
    if (k === 'system_prompt' && !listOnly) {
      out[k] = v;
      continue;
    }
    if (SECRET_FIELDS.has(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function appendLog(entry: Record<string, unknown>): Promise<void> {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    await fs.appendFile(LOG_FILE, line, 'utf8');
  } catch {
    console.error('[clones-api] log write failed');
  }
}

export async function readProfile(slug: string): Promise<Record<string, unknown> | null> {
  const p = path.join(CLIENTS_DIR, slug, 'profile.json');
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function validateSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !EXCLUDE_DIRS.has(slug);
}

export function safeClientDir(slug: string): string | null {
  if (!validateSlug(slug)) return null;
  const dir = path.join(CLIENTS_DIR, slug);
  if (!dir.startsWith(CLIENTS_DIR + path.sep)) return null;
  return dir;
}
