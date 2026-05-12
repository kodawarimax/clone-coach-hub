/**
 * POST /api/clones/:slug/restart — VPS で manage.sh restart {slug} を SSH 実行
 *
 * セキュリティ:
 *  - slug は ^[a-z][a-z0-9_-]*$ バリデーション
 *  - SSH は execFile (配列形式) で実行 — shell injection 防止
 *  - レート制限: 同一 slug への再起動は 60 秒に 1 回
 *  - 操作ログ: ~/.keiei_taku/clones-actions.log に append-only
 */

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { safeClientDir, appendLog, VPS_HOST } from '../../clones-utils';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

// レート制限: slug → 最終再起動 Unix タイムスタンプ (ms)
const restartTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

// ======================================================
// POST /api/clones/:slug/restart
// ======================================================
export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const { slug } = params;

  const clientDir = safeClientDir(slug);
  if (!clientDir) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  // レート制限チェック
  const lastRestart = restartTimestamps.get(slug) ?? 0;
  const elapsed = Date.now() - lastRestart;
  if (elapsed < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
    return NextResponse.json(
      { error: `Rate limited. Wait ${waitSec}s before restarting '${slug}' again.` },
      { status: 429 }
    );
  }

  restartTimestamps.set(slug, Date.now());

  try {
    const { stdout, stderr } = await execFileAsync('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=10',
      '-o', 'BatchMode=yes',
      `root@${VPS_HOST}`,
      `bash /root/clone/manage.sh restart ${slug} 2>&1`,
    ], { timeout: 30_000 });

    const output = (stdout + stderr).trim();

    await appendLog({ action: 'restart', slug, output: output.slice(0, 500) });

    return NextResponse.json({ success: true, slug, output });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await appendLog({ action: 'restart', slug, error: message });
    return NextResponse.json({ error: `SSH restart failed: ${message}` }, { status: 502 });
  }
}
