/**
 * POST /api/clones/:slug/deploy — じゅんごさん承認後に VPS で manage.sh deploy {slug} を SSH 実行
 *
 * セキュリティ:
 *  - confirmed !== true の場合は 403 を返す (二重承認ガード)
 *  - slug は ^[a-z][a-z0-9_-]*$ バリデーション
 *  - SSH は execFile (配列形式) — shell injection 防止
 *  - 操作ログ: ~/.keiei_taku/clones-actions.log に append-only
 */

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { safeClientDir, appendLog, VPS_HOST } from '../../clones-utils';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

// ======================================================
// POST /api/clones/:slug/deploy
// ======================================================
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse> {
  const { slug } = params;

  const clientDir = safeClientDir(slug);
  if (!clientDir) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  let body: { confirmed?: boolean; reason?: string };
  try {
    body = await req.json() as { confirmed?: boolean; reason?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // じゅんごさん承認チェック — ADR-020 安全境界遵守
  if (body.confirmed !== true) {
    return NextResponse.json(
      { error: 'じゅんごさんの最終承認が必要です。{ "confirmed": true, "reason": "..." } を送信してください。' },
      { status: 403 }
    );
  }

  const reason = (body.reason ?? '').slice(0, 500);

  await appendLog({ action: 'deploy_start', slug, reason });

  try {
    const { stdout, stderr } = await execFileAsync('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ConnectTimeout=15',
      '-o', 'BatchMode=yes',
      `root@${VPS_HOST}`,
      `bash /root/clone/manage.sh deploy ${slug} 2>&1`,
    ], { timeout: 120_000 });

    const output = (stdout + stderr).trim();

    await appendLog({ action: 'deploy_complete', slug, reason, output: output.slice(0, 1000) });

    return NextResponse.json({ success: true, slug, output });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await appendLog({ action: 'deploy_failed', slug, reason, error: message });
    return NextResponse.json({ error: `SSH deploy failed: ${message}` }, { status: 502 });
  }
}
