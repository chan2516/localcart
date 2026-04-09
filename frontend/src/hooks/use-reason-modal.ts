import { useState } from 'react'

type ReasonModalState<TTarget, TAction> = {
  open: boolean
  target: TTarget | null
  action: TAction | null
  reason: string
}

export function useReasonModal<TTarget, TAction = string>() {
  const [state, setState] = useState<ReasonModalState<TTarget, TAction>>({
    open: false,
    target: null,
    action: null,
    reason: '',
  })

  const open = (target: TTarget, action?: TAction | null) => {
    setState({
      open: true,
      target,
      action: action ?? null,
      reason: '',
    })
  }

  const close = () => {
    setState({
      open: false,
      target: null,
      action: null,
      reason: '',
    })
  }

  const setReason = (reason: string) => {
    setState((prev) => ({ ...prev, reason }))
  }

  return {
    state,
    open,
    close,
    setReason,
  }
}
