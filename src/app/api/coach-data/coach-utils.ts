import path from 'path';
import os from 'os';

export const CLIENTS_DIR = process.env.CLONE_CLIENTS_DIR
  ?? path.join(os.homedir(), 'Claude', 'Service', 'Clone', 'clients');

export const COACH_DIR_MAP: Record<string, string> = {
  kitahara: 'kitahara',
  sakurada: 'sakurada_coo',
  nogachan: 'nogachan',
};

export const COACH_META: Record<string, { displayName: string; emoji: string; accentColor: string }> = {
  kitahara: { displayName: '北原COO', emoji: '🎯', accentColor: '#C8860F' },
  sakurada: { displayName: '桜田部長', emoji: '💼', accentColor: '#3B82F6' },
  nogachan: { displayName: 'のがちゃん', emoji: '💪', accentColor: '#EF4444' },
};

export function coachDir(id: string): string | null {
  const dirName = COACH_DIR_MAP[id];
  if (!dirName) return null;
  const resolved = path.resolve(CLIENTS_DIR, dirName);
  if (!resolved.startsWith(CLIENTS_DIR + path.sep)) return null;
  return resolved;
}

export function memoryFilePath(id: string, file: 'current_content' | 'weekly_plan'): string | null {
  const dir = coachDir(id);
  return dir ? path.join(dir, 'memory', `${file}.md`) : null;
}

export function profileFilePath(id: string): string | null {
  const dir = coachDir(id);
  return dir ? path.join(dir, 'profile.json') : null;
}

export function knowledgeDirPath(id: string): string | null {
  const dir = coachDir(id);
  return dir ? path.join(dir, 'knowledge') : null;
}

export function buildCurrentContentMd(data: {
  updatedAt: string;
  title: string;
  type: string;
  url: string;
  duration: string;
  category: string;
  coachInstructions: string;
}): string {
  return `# 本日の学習コンテンツ（セッション開始時に参照）
**更新日**: ${data.updatedAt}
**タイトル**: ${data.title}
**種別**: ${data.type}
**URL**: ${data.url}
**尺**: ${data.duration}
**カテゴリ**: ${data.category}
**ステータス**: セッション前に表示済み

---
## コーチへの指示（必須）
${data.coachInstructions}
`;
}

export function parseCurrentContentMd(raw: string): {
  updatedAt: string;
  title: string;
  type: string;
  url: string;
  duration: string;
  category: string;
  coachInstructions: string;
} {
  const get = (key: string) => {
    const m = raw.match(new RegExp(`\\*\\*${key}\\*\\*:\\s*(.+)`));
    return m ? m[1].trim() : '';
  };
  const instructionMatch = raw.match(/## コーチへの指示（必須）\n([\s\S]*)/);
  return {
    updatedAt: get('更新日'),
    title: get('タイトル'),
    type: get('種別'),
    url: get('URL'),
    duration: get('尺'),
    category: get('カテゴリ'),
    coachInstructions: instructionMatch ? instructionMatch[1].trim() : '',
  };
}
