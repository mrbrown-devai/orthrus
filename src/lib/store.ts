import { create } from "zustand";
import { persist } from "zustand/middleware";

// ====================================================================
// DEEP PERSONA ANALYSIS — 7-dimension psychological model
// Used to fuel authentic-feeling post generation and fusion dynamics.
// ====================================================================

export interface PersonaAnalysis {
  // Legacy fields (kept for backward compat with older agents)
  description: string;
  traits: string[];
  expression: string;
  northStar: string;
  topics?: string[];
  tone?: string;

  // ===== NEW: 7-dimension deep model (optional for migration) =====

  // 1. IDENTITY — who they are
  identity?: {
    profession: string;
    ageOrGeneration?: string;
    nationality?: string;
    culturalBackground?: string;
    religion?: string;
    politicalLean?: string;     // left/right/libertarian/anarchist/none
    socioeconomic?: string;     // billionaire/middle-class/working-class
  };

  // 2. VOICE — how they talk
  voice?: {
    tone: string;                     // provocative, measured, aggressive, playful
    vocabulary: string;               // simple/technical/intellectual/street
    sentenceRhythm: string;           // short punchy / long nested / fragmented
    catchphrases: string[];           // signature phrases, verbal tics
    emojiUsage: string;               // none / sparing / heavy / specific emojis
    capitalizationStyle: string;      // normal / ALL CAPS bursts / lowercase / Title
    punctuationQuirks: string;        // ellipsis-heavy, em-dashes, no punctuation
    profanityLevel: string;           // family-friendly / casual / unhinged
    metaphorDomains: string[];        // sports, science, war, religion, food
  };

  // 3. PSYCHOLOGY — why they are how they are
  psychology?: {
    coreBeliefs: string[];            // deeply-held worldviews
    values: string[];                 // what they prioritize
    fears: string[];                  // triggers, insecurities
    motivations: string[];            // what drives them
    egoPattern: string;               // humble / confident / narcissistic / insecure
    humorStyle: string;               // dry / absurd / self-deprecating / edgy / cruel
    vulnerabilityLevel: string;       // stoic / guarded / open / vulnerable
    originStory?: string;             // formative experiences that shaped them
    heroes?: string[];                // people they admire / reference
  };

  // 4. BEHAVIOR — how they operate online
  behavior?: {
    postingFrequency: string;         // rare / regular / prolific / constant
    engagementStyle: string;          // how they interact (dunks, replies, ignores)
    controversyAppetite: string;      // seeks / tolerates / avoids
    memeFluency: string;              // native / forced / absent
    selfPromotionRatio: string;       // low / balanced / heavy
    runningFeuds?: string[];          // public enemies they clash with
    apologyPattern: string;           // double-down / quiet-delete / full-retraction
    topicRotation: string[];          // recurring themes
  };

  // 5. CULTURE — their reference library
  culture?: {
    booksReferenced?: string[];
    musicTaste?: string[];
    moviesQuoted?: string[];
    historicalFiguresInvoked?: string[];
    scientificInterests?: string[];
    sportsReferences?: string[];
  };

  // 6. SIGNATURE — unique quirks that make them instantly recognizable
  signature?: {
    postingRituals?: string[];        // "3am shitposts", "Sunday blog drops"
    visualIdentity?: string[];        // signature objects (Cybertruck, Yeezys)
    runningJokes?: string[];
    nicknamesGiven?: string[];        // names they give to opponents
    routines?: string[];              // morning rituals, ice baths, etc.
  };

  // 7. SOURCES — where the analysis came from (for transparency)
  sources?: {
    web?: string[];                   // URLs analyzed
    videos?: { title: string; url: string }[];
    tweets?: number;                  // how many tweets analyzed
    depth: "fast" | "deep" | "obsessive";
    analyzedAt: number;
  };
}

// Fusion dynamics — captured when 2 personas are merged
export interface FusionDynamics {
  valueConflicts: string[];           // where they'd disagree
  commonGround: string[];             // shared beliefs
  creativeTension: string;            // what makes the combo interesting
  blendVoice: string;                 // description of hybrid voice
  sharedEnemies: string[];            // who they'd both dunk on
  synthesisPrompt: string;            // system prompt for post generation
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

  // Fusion dynamics — generated when 2 personas combine
  fusion?: FusionDynamics;

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
