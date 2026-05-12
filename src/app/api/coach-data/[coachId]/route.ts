import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  coachDir,
  memoryFilePath,
  profileFilePath,
  knowledgeDirPath,
  parseCurrentContentMd,
} from '../coach-utils';

type Section = 'current_content' | 'weekly_plan' | 'profile' | 'knowledge';

const PROFILE_ALLOWED = ['description', 'specialties'];

async function safeWrite(filePath: string, content: string) {
  try { await fs.copyFile(filePath, filePath + '.bak'); } catch {}
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { coachId: string } }
) {
  const { coachId } = params;
  const section = req.nextUrl.searchParams.get('section') as Section | null;

  if (!coachDir(coachId)) {
    return NextResponse.json({ error: 'invalid coach' }, { status: 400 });
  }

  if (section === 'current_content' || section === 'weekly_plan') {
    const fp = memoryFilePath(coachId, section);
    if (!fp) return NextResponse.json({ content: '' });
    try {
      const content = await fs.readFile(fp, 'utf-8');
      const parsed = section === 'current_content' ? parseCurrentContentMd(content) : null;
      return NextResponse.json({ content, parsed });
    } catch {
      return NextResponse.json({ content: '' });
    }
  }

  if (section === 'profile') {
    const fp = profileFilePath(coachId);
    if (!fp) return NextResponse.json({ profile: {} });
    try {
      const raw = await fs.readFile(fp, 'utf-8');
      const profile = JSON.parse(raw);
      const safe = {
        displayName: profile.display_name || profile.name || '',
        description: profile.description || '',
        specialties: profile.specialties || [],
        model: profile.model || '',
        voiceId: profile.fish_audio_voice_id || profile.voice_id || '',
      };
      return NextResponse.json({ profile: safe });
    } catch {
      return NextResponse.json({ profile: {} });
    }
  }

  if (section === 'knowledge') {
    const kdir = knowledgeDirPath(coachId);
    if (!kdir) return NextResponse.json({ files: [] });
    try {
      const entries = await fs.readdir(kdir, { withFileTypes: true });
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile() && !e.name.endsWith('.bak'))
          .map(async (e) => {
            const stat = await fs.stat(path.join(kdir, e.name));
            return { name: e.name, size: stat.size, modified: stat.mtime.toISOString() };
          })
      );
      return NextResponse.json({ files: files.sort((a, b) => a.name.localeCompare(b.name)) });
    } catch {
      return NextResponse.json({ files: [] });
    }
  }

  return NextResponse.json({ error: 'invalid section' }, { status: 400 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { coachId: string } }
) {
  const { coachId } = params;
  const section = req.nextUrl.searchParams.get('section') as Section | null;

  if (!coachDir(coachId)) {
    return NextResponse.json({ error: 'invalid coach' }, { status: 400 });
  }

  const body = await req.json();

  if (section === 'current_content' || section === 'weekly_plan') {
    const fp = memoryFilePath(coachId, section);
    if (!fp) return NextResponse.json({ error: 'path error' }, { status: 500 });
    const content = typeof body.content === 'string' ? body.content : '';
    await safeWrite(fp, content);
    return NextResponse.json({ ok: true });
  }

  if (section === 'profile') {
    const fp = profileFilePath(coachId);
    if (!fp) return NextResponse.json({ error: 'path error' }, { status: 500 });
    const raw = await fs.readFile(fp, 'utf-8');
    const profile = JSON.parse(raw);
    const updates = body.updates || {};
    for (const key of PROFILE_ALLOWED) {
      if (key in updates) profile[key] = updates[key];
    }
    await safeWrite(fp, JSON.stringify(profile, null, 2));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid section' }, { status: 400 });
}
