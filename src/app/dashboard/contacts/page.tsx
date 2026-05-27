"use client";

import * as React from "react";

import { ClientDate } from "@/components/client-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type Contact = {
  id: string;
  phone: string;
  name: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
};

type SessionHistory = {
  id: string;
  conversation_id: string;
  current_flow: string | null;
  current_step: string | null;
  status: string;
  last_interaction_at: string;
};

export default function ContactsPage() {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<SessionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contacts");
      const json = await res.json().catch(() => null);
      setContacts((json?.contacts as Contact[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(contactId: string) {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/contacts/${encodeURIComponent(contactId)}/history`,
      );
      const json = await res.json().catch(() => null);
      setSessions((json?.sessions as SessionHistory[]) ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }

  function selectContact(contactId: string) {
    setSelectedId(contactId);
    void loadHistory(contactId);
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        phone,
        name: name || undefined,
        tags: tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        notes: notes || undefined,
      };

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus(json?.error ? String(json.error) : "Failed to save contact");
        return;
      }

      setStatus("Saved.");
      setPhone("");
      setName("");
      setTags("");
      setNotes("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            onSubmit={onSubmit}
          >
            <div className="space-y-1">
              <label className="text-sm">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 15551234567"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm">Tags (comma-separated)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. vip, leads"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm">Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save contact"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={load}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
              {status ? (
                <span className="text-sm text-foreground/70">{status}</span>
              ) : null}
            </div>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow
                  key={c.id}
                  className={
                    selectedId === c.id ? "bg-foreground/5" : undefined
                  }
                  onClick={() => selectContact(c.id)}
                >
                  <TableCell className="cursor-pointer">{c.phone}</TableCell>
                  <TableCell className="cursor-pointer">
                    {c.name ?? "—"}
                  </TableCell>
                  <TableCell className="cursor-pointer">
                    {c.tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-sm text-foreground/70 cursor-pointer">
                    {c.notes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {!contacts.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-foreground/70">
                    No contacts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!selected ? (
            <p className="text-foreground/60">
              Select a contact to view session history.
            </p>
          ) : historyLoading ? (
            <p className="text-foreground/60">Loading...</p>
          ) : sessions.length ? (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-md border border-foreground/10 p-3"
                >
                  <div className="font-medium">{s.current_flow ?? "—"}</div>
                  <div className="text-xs text-foreground/60">
                    Step: {s.current_step ?? "—"} · {s.status}
                  </div>
                  <div className="text-xs text-foreground/60 mt-1">
                    <ClientDate value={s.last_interaction_at} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground/60">No workflow sessions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
