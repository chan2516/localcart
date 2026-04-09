'use client'

import { Button } from '@/components/ui/button'

type ActionReasonModalProps = {
  open: boolean
  title: string
  subtitle?: string
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
  submitLabel: string
  submitVariant?: 'default' | 'destructive'
  disabled?: boolean
  textareaId: string
}

export function ActionReasonModal({
  open,
  title,
  subtitle,
  label,
  value,
  placeholder,
  onChange,
  onCancel,
  onSubmit,
  submitLabel,
  submitVariant = 'destructive',
  disabled = false,
  textareaId,
}: ActionReasonModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor={textareaId}>
            {label}
          </label>
          <textarea
            id={textareaId}
            className="min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button variant={submitVariant} onClick={onSubmit} disabled={disabled}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
