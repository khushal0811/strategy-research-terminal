'use client'

import React from 'react'
import Editor from '@monaco-editor/react'

interface StrategyEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function StrategyEditor({ value, onChange }: StrategyEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    if (val !== undefined) {
      onChange(val)
    }
  }

  const defaultPythonTemplate = `class CustomStrategy(BaseStrategy):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Initialize strategy indicators here (e.g. self.ma = SMA(20))
        pass

    def on_bar(self, bar):
        # Implement custom execution logic here
        # e.g., self.buy() or self.sell()
        pass
`

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <Editor
        height="220px"
        defaultLanguage="python"
        theme="vs-dark"
        value={value || defaultPythonTemplate}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  )
}
