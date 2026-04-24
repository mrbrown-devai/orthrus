import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PersonaAnalysis {
  description: string;
  traits: string[];
  expression: string;
  northStar: string;
  topics?: string[];
  tone?: string;
}

export interface Persona {
  id: string;
  name: string;
  xHandle?: string;
  instagram?: string;
  tiktok?: string;
  avatar?: string;
  analysis?: PersonaAnalysis;
  weight: number;
}

export interface AgentPost {
  id: string;
  content: string;
  platform: "x" | "telegram";
  timestamp: number;
  impressions?: number;
  likes?: number;
  replies?: number;
  url?: string;
}

export interface ChimeraAgent {
  id: string;
  name: string;
  description: string;
  personas: Persona[];
  tokenCA?: string;
  tokenTicker?: string;
  createdAt: number;
  
  // Stats
  postsToday: number;
  totalPosts: number;
  impressionsToday: number;
  totalImpressions: number;
  repliesToday: number;
  lastPostAt?: number;
  
  // Settings
  isActive: boolean;
  postsPerDay: number;
  replyToMentions: boolean;
  memeGenerationEnabled: boolean;
  memePrompt?: string;
  
  // Platform connections
  xConnected: boolean;
  xHandle?: string;
  xProfileUrl?: string;
  telegramConnected: boolean;
  telegramBotId?: number;
  telegramBotUsername?: string;
  telegramChannelUrl?: string;
  telegramChatIds?: string[];
  telegramWebhookSet?: boolean;
  activePlatforms: ("x" | "telegram")[];
  
  // Recent posts
  recentPosts: AgentPost[];

  // Autopilot (Solana Agent Kit integration)
  walletAddress?: string;
  autopilotMode?: "manual" | "on-post" | "scheduled";
  autopilotInterval?: number; // hours
  lastAutopilotAt?: number;
  autopilotActions?: AutopilotActionLog[];

  // Subscription Plan
  plan?: "free" | "degen" | "alpha" | "whale";
  planSubscribedAt?: number;
  planPaymentTx?: string;
  planPaymentCurrency?: string;

  // Forge fee tracking
  forgePaymentTx?: string;
  forgePaymentCurrency?: string;
}

export interface AutopilotActionLog {
  id: string;
  timestamp: number;
  type: string;
  reason: string;
  signature?: string;
  solscanUrl?: string;
  success: boolean;
  error?: string;
}

export interface TelegramUser {
  id: number;
  firstName: string;
  username?: string;
  photoUrl?: string;
}

interface ChimeraStore {
  telegramUser: TelegramUser | null;
  setTelegramUser: (user: TelegramUser) => void;
  clearTelegramUser: () => void;

  agents: ChimeraAgent[];
  currentAgentId: string | null;
  selectedPersonas: Persona[];
  
  addAgent: (agent: ChimeraAgent) => void;
  updateAgent: (id: string, updates: Partial<ChimeraAgent>) => void;
  removeAgent: (id: string) => void;
  setCurrentAgent: (id: string | null) => void;
  
  addPersona: (persona: Persona) => void;
  removePersona: (id: string) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  updatePersonaWeight: (id: string, weight: number) => void;
  updateAgentPersonaWeight: (agentId: string, personaId: string, weight: number) => void;
  clearSelectedPersonas: () => void;
  
  addTelegramChat: (agentId: string, chatId: string) => void;
  removeTelegramChat: (agentId: string, chatId: string) => void;
  addAutopilotAction: (agentId: string, action: AutopilotActionLog) => void;
  addPost: (agentId: string, post: AgentPost) => void;
  incrementPostCount: (agentId: string) => void;
  incrementReplyCount: (agentId: string) => void;
  addImpressions: (agentId: string, count: number) => void;
  resetDailyCounts: () => void;
}

export const useChimeraStore = create<ChimeraStore>()(
  persist(
    (set) => ({
      telegramUser: null,
      setTelegramUser: (user) => set({ telegramUser: user }),
      clearTelegramUser: () => set({ telegramUser: null }),

      agents: [],
      currentAgentId: null,
      selectedPersonas: [],

      addAgent: (agent) =>
        set((state) => ({
          agents: [...state.agents, {
            ...agent,
            totalPosts: agent.totalPosts ?? 0,
            impressionsToday: agent.impressionsToday ?? 0,
            totalImpressions: agent.totalImpressions ?? 0,
            postsPerDay: agent.postsPerDay ?? 5,
            replyToMentions: agent.replyToMentions ?? true,
            memeGenerationEnabled: agent.memeGenerationEnabled ?? false,
            memePrompt: agent.memePrompt ?? "",
            recentPosts: agent.recentPosts ?? [],
          }],
          currentAgentId: agent.id,
        })),

      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          currentAgentId:
            state.currentAgentId === id ? null : state.currentAgentId,
        })),

      setCurrentAgent: (id) => set({ currentAgentId: id }),

      addPersona: (persona) =>
        set((state) => {
          if (state.selectedPersonas.length >= 2) return state;
          if (state.selectedPersonas.find((p) => p.id === persona.id)) return state;
          return {
            selectedPersonas: [...state.selectedPersonas, { ...persona, weight: 50 }],
          };
        }),

      removePersona: (id) =>
        set((state) => ({
          selectedPersonas: state.selectedPersonas.filter((p) => p.id !== id),
        })),

      updatePersona: (id, updates) =>
        set((state) => ({
          selectedPersonas: state.selectedPersonas.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      updatePersonaWeight: (id, weight) =>
        set((state) => ({
          selectedPersonas: state.selectedPersonas.map((p) =>
            p.id === id ? { ...p, weight } : p
          ),
        })),

      updateAgentPersonaWeight: (agentId, personaId, weight) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  personas: a.personas.map((p, i) =>
                    p.id === personaId
                      ? { ...p, weight }
                      : i === 0
                      ? { ...p, weight: 100 - weight }
                      : { ...p, weight }
                  ),
                }
              : a
          ),
        })),

      clearSelectedPersonas: () =>
        set({ selectedPersonas: [] }),

      addTelegramChat: (agentId, chatId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, telegramChatIds: [...new Set([...(a.telegramChatIds || []), chatId])] }
              : a
          ),
        })),

      removeTelegramChat: (agentId, chatId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, telegramChatIds: (a.telegramChatIds || []).filter((id) => id !== chatId) }
              : a
          ),
        })),

      addAutopilotAction: (agentId, action) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  autopilotActions: [action, ...(a.autopilotActions || [])].slice(0, 20),
                  lastAutopilotAt: action.timestamp,
                }
              : a
          ),
        })),

      addPost: (agentId, post) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  recentPosts: [post, ...a.recentPosts].slice(0, 10),
                  postsToday: a.postsToday + 1,
                  totalPosts: a.totalPosts + 1,
                  lastPostAt: Date.now(),
                }
              : a
          ),
        })),

      incrementPostCount: (agentId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, postsToday: a.postsToday + 1, totalPosts: a.totalPosts + 1, lastPostAt: Date.now() }
              : a
          ),
        })),

      incrementReplyCount: (agentId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, repliesToday: a.repliesToday + 1 } : a
          ),
        })),

      addImpressions: (agentId, count) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  impressionsToday: a.impressionsToday + count,
                  totalImpressions: a.totalImpressions + count,
                }
              : a
          ),
        })),

      resetDailyCounts: () =>
        set((state) => ({
          agents: state.agents.map((a) => ({
            ...a,
            postsToday: 0,
            repliesToday: 0,
            impressionsToday: 0,
          })),
        })),
    }),
    {
      name: "orthrus-storage",
    }
  )
);
