"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FlowListItem = {
  id: string;
  name: string;
  trigger_keywords: string[];
  fallback_flow_id: string | null;
  enabled: boolean;
  stepCount: number;
};

type FlowStepInput = {
  step_id: string;
  type: string;
  payload: Record<string, unknown>;
};

const EMPTY_STEPS_JSON = `[
  {
    "step_id": "step_1",
    "type": "message",
    "payload": { "text": "Hello!" }
  }
]`;

export default function WorkflowsPage() {
  const [flows, setFlows] = React.useState<FlowListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [id, setId] = React.useState("");
  const [name, setName] = React.useState("");
  const [keywords, setKeywords] = React.useState("");
  const [fallbackFlowId, setFallbackFlowId] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [stepsJson, setStepsJson] = React.useState(EMPTY_STEPS_JSON);

  async function loadFlows() {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows");
      const json = await res.json().catch(() => null);
      setFlows((json?.flows as FlowListItem[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function loadFlow(flowId: string) {
    setStatus(null);
    const res = await fetch(`/api/workflows/${encodeURIComponent(flowId)}`);
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.flow) {
      setStatus(json?.error ? String(json.error) : "Failed to load flow");
      return;
    }

    const flow = json.flow as {
      id: string;
      name: string;
      trigger_keywords: string[];
      fallback_flow_id: string | null;
      enabled: boolean;
      steps: FlowStepInput[];
    };

    setSelectedId(flow.id);
    setId(flow.id);
    setName(flow.name);
    setKeywords((flow.trigger_keywords ?? []).join(", "));
    setFallbackFlowId(flow.fallback_flow_id ?? "");
    setEnabled(flow.enabled);
    setStepsJson(JSON.stringify(flow.steps ?? [], null, 2));
  }

  function resetEditor() {
    setSelectedId(null);
    setId("");
    setName("");
    setKeywords("");
    setFallbackFlowId("");
    setEnabled(true);
    setStepsJson(EMPTY_STEPS_JSON);
    setStatus(null);
  }

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFlows();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      let steps: FlowStepInput[] = [];
      try {
        steps = JSON.parse(stepsJson) as FlowStepInput[];
        if (!Array.isArray(steps)) throw new Error("Steps must be a JSON array");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Invalid steps JSON");
        return;
      }

      const payload = {
        id: id.trim(),
        name: name.trim(),
        trigger_keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        fallback_flow_id: fallbackFlowId.trim() || null,
        enabled,
        steps,
      };

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus(json?.error ? String(json.error) : "Failed to save workflow");
        return;
      }

      setStatus("Workflow saved.");
      setSelectedId(payload.id);
      await loadFlows();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    if (!confirm(`Delete workflow "${selectedId}"?`)) return;

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/workflows/${encodeURIComponent(selectedId)}`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setStatus(json?.error ? String(json.error) : "Failed to delete");
        return;
      }
      setStatus("Workflow deleted.");
      resetEditor();
      await loadFlows();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Workflows</CardTitle>
          <Button type="button" variant="secondary" size="sm" onClick={resetEditor}>
            New
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={loadFlows}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh list"}
          </Button>

          <div className="space-y-1 max-h-[60vh] overflow-auto">
            {flows.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => loadFlow(f.id)}
                className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                  selectedId === f.id
                    ? "border-foreground/30 bg-foreground/5"
                    : "border-foreground/10 hover:bg-foreground/5"
                }`}
              >
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-foreground/60 flex items-center gap-2 mt-1">
                  <span>{f.id}</span>
                  {f.enabled ? (
                    <Badge variant="success">On</Badge>
                  ) : (
                    <Badge variant="secondary">Off</Badge>
                  )}
                  <span>{f.stepCount} steps</span>
                </div>
              </button>
            ))}
            {!flows.length && (
              <p className="text-sm text-foreground/60">No workflows yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedId ? `Edit: ${selectedId}` : "Create workflow"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm">Flow ID</label>
                <Input
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="welcome_flow"
                  required
                  disabled={!!selectedId}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Welcome Flow"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Trigger keywords (comma-separated)</label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="hi, hello"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm">Fallback flow ID (optional)</label>
                <Input
                  value={fallbackFlowId}
                  onChange={(e) => setFallbackFlowId(e.target.value)}
                  placeholder="fallback_flow"
                />
              </div>
              <label className="flex items-center gap-2 text-sm pt-6">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Steps (JSON array)</label>
              <Textarea
                value={stepsJson}
                onChange={(e) => setStepsJson(e.target.value)}
                className="font-mono text-xs min-h-[280px]"
              />
              <p className="text-xs text-foreground/60">
                Types: message, buttons, list, input, condition, api, end. Each
                step needs step_id, type, and payload.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save workflow"}
              </Button>
              {selectedId ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={saving}
                >
                  Delete
                </Button>
              ) : null}
              {status ? (
                <span className="text-sm text-foreground/70 self-center">
                  {status}
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
