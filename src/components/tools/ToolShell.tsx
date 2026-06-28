import { type ReactNode, useRef, useState } from 'react'
import { UploadIcon } from '../../lib/icons'

interface ShellProps {
  title: string
  desc: string
  children: ReactNode
}

export function ToolShell({ title, desc, children }: ShellProps) {
  return (
    <main className="tool-page">
      <div className="tool-container">
        <header className="tool-header">
          <h2 className="tool-title">{title}</h2>
          <p className="tool-desc">{desc}</p>
        </header>
        {children}
      </div>
    </main>
  )
}

interface DropzoneProps {
  multiple?: boolean
  hint?: string
  onFiles: (files: File[]) => void
}

export function Dropzone({ multiple = false, hint, onFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const handle = (list: FileList | null) => {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'))
    if (files.length) {
      onFiles(multiple ? files : [files[0]])
    }
  }

  return (
    <div
      className={`tool-dropzone${over ? ' over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        handle(e.dataTransfer.files)
      }}
    >
      <UploadIcon size={48} strokeWidth={1.5} />
      <p>点击选择{multiple ? '一张或多张' : ''}图片，或拖拽到此处</p>
      {hint && <span className="tool-dropzone-hint">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
