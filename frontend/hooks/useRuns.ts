const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export async function fetchRuns(token: string) {
  const res = await fetch(`${API}/api/runs/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch runs')
  return res.json()
}

export async function fetchRun(token: string, runId: string) {
  const res = await fetch(`${API}/api/runs/${runId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Run not found')
  return res.json()
}

export async function deleteRun(token: string, runId: string) {
  const res = await fetch(`${API}/api/runs/${runId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to delete run')
}

export async function saveReport(token: string, runId: string, report: string) {
  const res = await fetch(`${API}/api/runs/${runId}/report`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ report }),
  })
  if (!res.ok) throw new Error('Failed to save report')
  return res.json()
}
