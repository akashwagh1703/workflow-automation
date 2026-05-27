export type WorkflowStepType =
  | "message"
  | "buttons"
  | "list"
  | "input"
  | "condition"
  | "api"
  | "end";

export type WorkflowStep = {
  id: string;
  type: WorkflowStepType;

  // Each step type uses a different payload shape, so we keep it generic.
  // The flow-executor interprets this at runtime.
  payload: Record<string, unknown>;
};

export type FlowDefinition = {
  id: string;
  enabled: boolean;

  // Keywords used by the router to start this flow.
  triggerKeywords: string[];

  // Used when no trigger matches. Can be null if no fallback exists.
  fallbackFlowId: string | null;

  // Ordered steps. The executor reads step.type + step.payload.
  steps: WorkflowStep[];
};

