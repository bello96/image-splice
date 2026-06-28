import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  const hideToast = useStore((s) => s.hideToast)

  useEffect(() => {
    if (!toast.visible) {
      return
    }
    const timer = setTimeout(hideToast, 2500)
    return () => clearTimeout(timer)
  }, [toast.key, toast.visible, hideToast])

  return (
    <div id="toast" className={`${toast.visible ? 'show ' : ''}${toast.type}`}>
      {toast.message}
    </div>
  )
}
