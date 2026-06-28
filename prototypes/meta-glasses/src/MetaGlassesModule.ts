export type MetaGlassesCapabilities = {
  pairedDeviceDetected: boolean;
  display: boolean;
  input: boolean;
  camera: boolean;
  audio: boolean;
};

export type MetaGlassesAction = {
  type: "open" | "complete" | "snooze" | "refresh" | string;
  payload?: Record<string, string>;
};

export type MetaGlassesModuleShape = {
  isAvailable(): Promise<boolean>;
  getCapabilities(): Promise<MetaGlassesCapabilities>;
  connect(): Promise<boolean>;
  showCoachCard(input: {
    title: string;
    message: string;
    actions?: string[];
  }): Promise<void>;
  showOrbitProgress(input: {
    name: string;
    healthScore?: number | null;
    level?: number | null;
    milestone?: string | null;
  }): Promise<void>;
  clear(): Promise<void>;
};

export const metaGlassesMvpUseCases = {
  askCoach: {
    supported: "likely",
    nativeNeeds: ["display", "input"],
    backend: "/api/ai/coach/chat",
  },
  completeHabitOrTask: {
    supported: "likely-with-guardrails",
    nativeNeeds: ["display", "input"],
    backend: "existing habit/task completion endpoints",
  },
  captureProofPhoto: {
    supported: "unconfirmed",
    nativeNeeds: ["camera"],
    fallback: "open phone proof flow",
  },
  viewOrbitProgress: {
    supported: "likely",
    nativeNeeds: ["display"],
    backend: "existing Orbit dashboard/watch summary data",
  },
} as const;

