import { NextResponse } from 'next/server';
import fs from 'fs';
import { COACH_DIR_MAP, COACH_META, profileFilePath } from './coach-utils';

export async function GET() {
  const coaches = Object.keys(COACH_DIR_MAP).map((id) => {
    const meta = COACH_META[id];
    let description = '';
    let specialties: string[] = [];
    try {
      const raw = fs.readFileSync(profileFilePath(id)!, 'utf-8');
      const profile = JSON.parse(raw);
      description = profile.description || '';
      specialties = profile.specialties || [];
    } catch {}
    return { id, ...meta, description, specialties };
  });
  return NextResponse.json({ coaches });
}
