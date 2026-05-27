"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
  totalMessages: number;
  activeConversations: number;
  workflowsCount: number;
  contactsCount: number;
};

export default function DashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const nextStats = json?.stats as Stats | undefined;
      if (!nextStats || cancelled) return;
      setStats(nextStats);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stats ? (
            <div className="text-sm text-foreground/70">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-foreground/10 p-4">
                <div className="text-xs text-foreground/70">Total Messages</div>
                <div className="text-2xl font-semibold">{stats.totalMessages}</div>
              </div>
              <div className="rounded-lg border border-foreground/10 p-4">
                <div className="text-xs text-foreground/70">
                  Active Conversations
                </div>
                <div className="text-2xl font-semibold">
                  {stats.activeConversations}
                </div>
              </div>
              <div className="rounded-lg border border-foreground/10 p-4">
                <div className="text-xs text-foreground/70">Workflows</div>
                <div className="text-2xl font-semibold">{stats.workflowsCount}</div>
              </div>
              <div className="rounded-lg border border-foreground/10 p-4">
                <div className="text-xs text-foreground/70">Contacts</div>
                <div className="text-2xl font-semibold">{stats.contactsCount}</div>
              </div>
            </div>
          )}

          <div className="text-sm text-foreground/70">
            Configure WhatsApp under Integrations, then manage workflows and
            reply from the Inbox.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

