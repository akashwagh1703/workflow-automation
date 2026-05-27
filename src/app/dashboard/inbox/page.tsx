"use client";

import * as React from "react";

import { ClientDate } from "@/components/client-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InboxConversation = {
  id: string;
  status: string;
  lastInteractionAt: string;
  contact: null | {
    id: string;
    phone: string;
    name: string | null;
  };
  lastMessage: null | {
    message: string | null;
  };
};

type ThreadMessage = {
  id: string;
  direction: string;
  type: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default function InboxPage() {
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [conversations, setConversations] = React.useState<InboxConversation[]>(
    [],
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [threadLoading, setThreadLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  async function loadConversations(query?: string) {
    setLoading(true);
    try {
      const q = (query ?? search).trim();
      const url = q
        ? `/api/inbox/conversations?q=${encodeURIComponent(q)}`
        : "/api/inbox/conversations";
      const res = await fetch(url);
      const json = await res.json().catch(() => null);
      setConversations((json?.conversations as InboxConversation[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(conversationId: string) {
    setThreadLoading(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus(json?.error ? String(json.error) : "Failed to load messages");
        setMessages([]);
        return;
      }
      setMessages((json.messages as ThreadMessage[]) ?? []);
    } finally {
      setThreadLoading(false);
    }
  }

  function selectConversation(conversationId: string) {
    setSelectedId(conversationId);
    void loadThread(conversationId);
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      void loadThread(selectedId);
      void loadConversations();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, search]);

  async function onSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/inbox/conversations/${encodeURIComponent(selectedId)}/reply`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: replyText.trim() }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus(json?.error ? String(json.error) : "Failed to send reply");
        return;
      }
      setReplyText("");
      await loadThread(selectedId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <Card className="lg:col-span-1 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 flex-1 min-h-0">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadConversations(search);
            }}
          >
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone or name"
            />
            <Button type="submit" variant="secondary" disabled={loading}>
              Go
            </Button>
          </form>

          <div className="flex-1 overflow-auto space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                  selectedId === c.id
                    ? "border-foreground/30 bg-foreground/5"
                    : "border-foreground/10 hover:bg-foreground/5"
                }`}
              >
                <div className="font-medium">
                  {c.contact?.name ?? c.contact?.phone ?? "Unknown"}
                </div>
                <div className="text-xs text-foreground/60 truncate">
                  {c.lastMessage?.message ?? "No messages"}
                </div>
              </button>
            ))}
            {!conversations.length && (
              <p className="text-sm text-foreground/60">No conversations.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>
            {selected
              ? `${selected.contact?.name ?? selected.contact?.phone ?? "Chat"}`
              : "Select a conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 gap-3">
          {!selectedId ? (
            <p className="text-sm text-foreground/60">
              Pick a conversation to view messages and reply manually.
            </p>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-2 rounded-md border border-foreground/10 p-3">
                {threadLoading ? (
                  <p className="text-sm text-foreground/60">Loading...</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.direction === "outbound" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          m.direction === "outbound"
                            ? "bg-foreground text-background"
                            : "bg-foreground/10 text-foreground"
                        }`}
                      >
                        <div>{m.message ?? `(${m.type})`}</div>
                        <div className="text-[10px] opacity-70 mt-1 flex gap-2">
                          <ClientDate value={m.created_at} />
                          {m.status !== "sent" && m.status !== "received" ? (
                            <span>{m.status}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="space-y-2" onSubmit={onSendReply}>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a manual reply..."
                  className="min-h-[80px]"
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={sending || !replyText.trim()}>
                    {sending ? "Sending..." : "Send reply"}
                  </Button>
                  {status ? (
                    <span className="text-sm text-red-500">{status}</span>
                  ) : null}
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
