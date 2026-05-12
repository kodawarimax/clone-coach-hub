/**
 * GET /api/clones/:slug/logs?lines=100 — VPS でログ tail を SSH 取得
 *
 * セキュリティ:
 *  - slug は ^[a-z][a-z0-9_-]*$ バリデーション
 *  - SSH は execFile (配列形式) — shell injection 防止
 *  - lines は 1-500 に clamp
 *  - ログ内の API key パターン (sk-/AIza/xox/ghp_) は [REDACTED]
 */

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { safeClientDir, VPS_HOST } from '../../clones-utils';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const SECRET_LOG_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9\-_]{20,}/g,
  /AIza[a-zA-Z0-9\-_]{35}/g,
  /xox[baprs]-[a-zA-Z0-9\-]+/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /Bearer\s+[a-zA-Z0-9\-_.=]{8,}/gi,
];

function redactLogContent(text: string): string {
  let result = text;
  for (const pattern of SECRET_LOG_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

// ======================================================
// GET /api/clones/:slug/logs?lines=100
// ======================================================
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const { slug } = params;

  const clientDir = safeClientDir(slug);
  if (!clientDir) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const rawLines = parseInt(req.nextUrl.searchParams.get('lines') ?? '100', 10);
  const lines = Math.max(1, Math.min(500, isNaN(rawLines) ? 100 : rawLines));

  try {
    const { stdout, stderr } = await execFileAsync('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      '-o', 'BatchMode=yes',
      `root@${VPS_HOST}`,
      `bash /root/clone/manage.sh logs ${slug} 2>/dev/null | tail -n ${lines}`,
    ], { timeout: 20_000 });

    const raw = (stdout + stderr).trim();
    const redacted = redactLogContent(raw);

    return NextResponse.json({ slug, lines, log: redacted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `SSH log fetch failed: ${message}` }, { status: 502 });
  }
}
