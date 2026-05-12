'use client';
import { X } from 'lucide-react';

const NAVY = '#1A2E4A';
const GOLD = '#C8860F';

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  extra?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function ConfirmModal({
  title, description, confirmLabel = '実行', cancelLabel = 'キャンセル',
  variant = 'default', extra, onConfirm, onCancel, disabled = false,
}: ConfirmModalProps) {
  const colors = {
    danger: { bg: '#FEF2F2', border: '#FECACA', btn: '#EF4444', btnHover: '#DC2626' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', btn: GOLD, btnHover: '#B07A0B' },
    default: { bg: '#F0F9FF', border: '#BAE6FD', btn: NAVY, btnHover: '#0F1E32' },
  }[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,30,50,0.65)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }} onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.bg }}>
          <span id="confirm-modal-title" style={{ fontWeight: 700, fontSize: 14, color: '#1A2E4A' }}>{title}</span>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {description && <p style={{ fontSize: 13, color: '#4A5568', margin: '0 0 12px 0', lineHeight: 1.6 }}>{description}</p>}
          {extra}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#718096', fontSize: 13, cursor: 'pointer' }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: 8,
              background: disabled ? '#E2E8F0' : colors.btn,
              color: disabled ? '#A0AEC0' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
