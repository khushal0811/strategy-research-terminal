'use client'

import React, { useState } from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { useAuthStore } from '@/store/authStore'
import { generateAiReport } from '@/llm/reportGenerator'
import { GroqProvider } from '@/llm/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { Loader2, Sparkles, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AIReport() {
  const { metrics, report, setReport, llmApiKey, status, dbRunId } = useTerminalStore()
  const [isLoading, setIsLoading] = useState(false)

  if (status !== 'complete' || !metrics) {
    return null
  }

  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      const provider = new GroqProvider(llmApiKey)
      const mdReport = await generateAiReport(metrics, provider)
      setReport(mdReport)
      toast.success('AI Performance Report generated successfully!')

      // Auto-save to database if authenticated and dbRunId is available
      const token = useAuthStore.getState().accessToken
      if (token && dbRunId) {
        const { saveReport } = await import('@/hooks/useRuns')
        await saveReport(token, dbRunId, mdReport)
        toast.success('AI Report saved to history.')
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error)
      toast.error(error.message || 'Failed to generate performance report.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>AI Strategy Report</span>
          </CardTitle>
          <CardDescription>
            Generate an automated quantitative analysis and review of backtest execution.
          </CardDescription>
        </div>
        {!report && (
          <Button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="font-semibold text-xs h-9 flex items-center shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate AI Report
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {report ? (
          <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg bg-card p-6 shadow-xs leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold border-b pb-2 mb-4 mt-6 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-muted-foreground mb-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-muted-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-muted-foreground">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/40 bg-muted/30 pl-4 py-2 italic my-3 rounded-r">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {report}
            </ReactMarkdown>
            <div className="flex justify-end pt-4 border-t mt-6">
              <Button variant="outline" size="sm" onClick={() => setReport('')} className="text-xs">
                Clear Report
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/10">
            <p>No report generated yet.</p>
            <p className="text-xs mt-1">Configure your API key and click "Generate AI Report" to start analyzing metrics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
