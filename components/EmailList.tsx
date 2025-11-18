'use client'

import { useState } from 'react'

export interface Email {
  id: string
  sender: string
  subject: string
  body: string
  category: string
  received_at: string
  resolved: boolean
}

interface EmailListProps {
  emails: Email[]
  title: string
}

export default function EmailList({ emails, title }: EmailListProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const generateDraft = async (emailId: string) => {
    setLoadingAction(`${emailId}:draft`)
    await fetch('/api/n8n/generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, webhookId: '' }),
    })
    setLoadingAction(null)
  }

  const markResolved = async (emailId: string) => {
    setLoadingAction(`${emailId}:resolve`)
    await fetch('/api/n8n/mark-resolved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, webhookId: '' }),
    })
    setLoadingAction(null)
  }

  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2 text-purple">{title}</h3>
      {(!emails || emails.length === 0) ? (
        <p className="text-sm text-purple-light">No emails.</p>
      ) : (
        <ul className="divide-y divide-graphite-light">
          {emails.map((email) => (
            <li
              key={email.id}
              className="py-3 flex justify-between items-start"
            >
              <div>
                <p className="font-medium">{email.subject}</p>
                <p className="text-xs text-purple-light">{email.sender}</p>
                <p className="text-xs text-graphite-light">
                  {new Date(email.received_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!email.resolved && (
                  <>
                    <button
                      onClick={() => generateDraft(email.id)}
                      disabled={loadingAction === `${email.id}:draft`}
                      className="bg-purple hover:bg-magenta text-black py-1 px-2 rounded-md text-xs transition-colors"
                    >
                      {loadingAction === `${email.id}:draft` ? 'Generating…' : 'Draft reply'}
                    </button>
                    <button
                      onClick={() => markResolved(email.id)}
                      disabled={loadingAction === `${email.id}:resolve`}
                      className="bg-graphite-light hover:bg-purple text-white py-1 px-2 rounded-md text-xs transition-colors"
                    >
                      {loadingAction === `${email.id}:resolve` ? 'Marking…' : 'Resolve'}
                    </button>
                  </>
                )}
                {email.resolved && <span className="text-xs text-green-400">Resolved</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}