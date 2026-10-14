import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  AppCheck,
} from 'firebase/app-check';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  GenerativeModel,
  ChatSession,
} from 'firebase/ai';

// ----------------------------------------------------------------------
// 1. Safe Environment Variable Resolution
// ----------------------------------------------------------------------
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key] as string;
    }
  } catch {}
  return '';
};

const isDevEnvironment = (): boolean => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV !== undefined) {
      return Boolean((import.meta as any).env.DEV);
    }
  } catch {}
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
};

// ----------------------------------------------------------------------
// 2. Firebase Client Configuration
// ----------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

// Check if client configuration is present (appId & apiKey are mandatory for Firebase AI Logic)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey?.trim() &&
  firebaseConfig.projectId?.trim() &&
  firebaseConfig.appId?.trim()
);

// ----------------------------------------------------------------------
// 3. Local Development App Check Debug Token Setup
// ----------------------------------------------------------------------
if (typeof window !== 'undefined') {
  const customDebugToken = getEnvVar('VITE_FIREBASE_APPCHECK_DEBUG_TOKEN');
  if (customDebugToken && customDebugToken.trim() !== '') {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = customDebugToken.trim();
  } else if (isDevEnvironment()) {
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

// ----------------------------------------------------------------------
// 4. Service Instances & Optimized System Instruction
// ----------------------------------------------------------------------
let firebaseAppInstance: FirebaseApp | null = null;
let appCheckInstance: AppCheck | null = null;
let generativeModelInstance: GenerativeModel | null = null;
let activeChatSession: ChatSession | null = null;
let lastSessionHistoryLength = 0;
let isSessionClean = false;

export const AI_MODEL_NAME =
  getEnvVar('VITE_FIREBASE_AI_MODEL').trim() || 'gemini-3.8-flash';

/**
 * Concise, token-optimized system instruction for NEEDIT Campus Assistant:
 * Preserves all campus rules, safety boundaries, and 13 spots without duplicated prose.
 */
export const CAMPUS_SYSTEM_INSTRUCTION = `You are "Ask NEEDIT", the AI campus assistant for SASTRA University (Thanjavur) & NeedIt peer delivery.
Rules:
1. Scope: Answer campus logistics & NeedIt delivery questions concisely. Politely decline out-of-scope tasks (homework, exams, code, medical).
2. Clarification: If user input is gibberish (e.g. "ahsdfa"), ambiguous, or incomplete, politely ask for clarification.
3. Strict Dietary Rule: SASTRA is strictly 100% vegetarian. All non-veg items (chicken, mutton, fish, egg, meat, etc.) are strictly prohibited.
4. 13 Official Delivery Spots: Ananda Vihar (Boys), Vaidehi/VK (Girls), Canopy Canteen, Canopy Lawn, Library Circle, Vihar Gate, Main Gate Security, CCC, Pharmacy Gate, JVC Canteen, Meera Mess Circle, Rajalakshmi Circle, Krishna Circle.
5. NeedIt Model: Peer-to-peer student delivery, requester sets helper fee (₹20–₹50), 3-step security (shelf photo receipt, direct UPI pay, 4-digit handover OTP).
6. Honest Facts: Only cite verified campus landmarks (Canopy, Library Xerox, Health Centre). Never invent fake shop names, ratings, or reviews. If real-time stock/pricing is unknown, state so honestly and suggest posting a NeedIt request.
7. Tone: Friendly, concise, helpful.`;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  if (!firebaseAppInstance) {
    try {
      firebaseAppInstance =
        getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    } catch (err) {
      console.error('[NeedIt Firebase] Failed to initialize FirebaseApp:', err);
      return null;
    }
  }

  return firebaseAppInstance;
}

export function initAppCheck(): AppCheck | null {
  if (appCheckInstance) return appCheckInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  const recaptchaKey =
    getEnvVar('VITE_FIREBASE_RECAPTCHA_ENTERPRISE_KEY').trim();

  if (!recaptchaKey) {
    if (isDevEnvironment()) {
      console.info(
        '[NeedIt App Check] VITE_FIREBASE_RECAPTCHA_ENTERPRISE_KEY not set. Running in development mode.'
      );
    }
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.info('[NeedIt App Check] Initialized with reCAPTCHA Enterprise provider.');
  } catch (err) {
    console.warn('[NeedIt App Check] Initialization note:', err);
  }

  return appCheckInstance;
}

export function getGenerativeModelInstance(): GenerativeModel | null {
  if (generativeModelInstance) return generativeModelInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  // Initialize App Check so calls carry attestation tokens
  initAppCheck();

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    generativeModelInstance = getGenerativeModel(ai, {
      model: AI_MODEL_NAME,
      systemInstruction: CAMPUS_SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        topP: 0.95,
      },
    });

    console.info(
      `[NeedIt Firebase AI] Generative model initialized with ${AI_MODEL_NAME} (Gemini Developer API).`
    );
  } catch (err) {
    console.error('[NeedIt Firebase AI] Failed to initialize GenerativeModel:', err);
  }

  return generativeModelInstance;
}

export function resetActiveChatSession() {
  activeChatSession = null;
  lastSessionHistoryLength = 0;
  isSessionClean = false;
}

export interface CampusChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StreamAiCallbacks {
  onChunk: (chunkText: string) => void;
  signal?: AbortSignal;
}

/**
 * Strict sanitizer for Gemini conversation history.
 * Guarantees that:
 * 1. History strictly alternates: user -> model -> user -> model...
 * 2. History only contains non-empty, successfully completed turns.
 * 3. History always starts with 'user' (if non-empty).
 * 4. History always ends with 'model' (so that the next message can be 'user').
 * 5. Trailing or unpaired 'user' messages are eliminated, preventing the
 *    "Content with role 'user' can't follow 'user'" Gemini API error.
 */
export function sanitizeConversationHistory(
  history: CampusChatMessage[]
): CampusChatMessage[] {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  const sanitized: CampusChatMessage[] = [];
  let pendingUser: CampusChatMessage | null = null;

  for (const msg of history) {
    if (!msg || typeof msg.text !== 'string') continue;
    const trimmed = msg.text.trim();
    if (!trimmed) continue;

    if (msg.role === 'user') {
      // Store latest user message (overwriting any previous user message that lacked a model response)
      pendingUser = { role: 'user', text: trimmed };
    } else if (msg.role === 'model') {
      // Model message is only valid if it follows a user message
      if (pendingUser) {
        sanitized.push(pendingUser);
        sanitized.push({ role: 'model', text: trimmed });
        pendingUser = null;
      }
    }
  }

  // Any trailing pendingUser without a model response is intentionally omitted,
  // because the incoming newMessage will provide the next user turn.
  return sanitized;
}

/**
 * Format raw API errors into clear, actionable messages for students and developers.
 * Never silently swallow errors or return misleading canned answers.
 */
function parseAiError(err: any): string {
  const errMsg = err?.message || String(err);

  if (errMsg.includes("can't follow 'user'") || errMsg.includes('invalid-content')) {
    return 'Conversation sequence sync issue. Conversation has been safely reset to ensure clean dialogue.';
  }

  if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
    return 'Invalid Firebase API key. Please check your VITE_FIREBASE_API_KEY in web/.env and confirm the Gemini Developer API is enabled in your Google Cloud / Firebase project.';
  }

  if (errMsg.includes('App Check') || errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED')) {
    return 'App Check attestation error (HTTP 403). In local development, ensure your App Check debug token printed in the browser console is registered in Firebase Console > App Check > Apps > Manage debug tokens.';
  }

  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
    return 'Gemini API quota exceeded or rate limit reached (HTTP 429). Please wait a moment before asking again.';
  }

  if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('model not found')) {
    return `The requested Gemini model (${AI_MODEL_NAME}) was not found or is unavailable for your project tier. Check VITE_FIREBASE_AI_MODEL in web/.env.`;
  }

  if (errMsg.includes('fetch-error') || errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
    return 'Network connection error: Unable to reach Google Firebase AI Logic. Please check your internet connection.';
  }

  return `Firebase AI Logic error: ${errMsg}`;
}

/**
 * Stream a message from Gemini via Firebase AI Logic.
 * Calls onChunk progressively as tokens are generated, drastically reducing perceived latency.
 * Reuses the active ChatSession when safe, but recovers cleanly and reconstructs from sanitized
 * history if any error or cancellation occurs.
 */
export async function streamCampusAiMessage(
  history: CampusChatMessage[],
  newMessage: string,
  callbacks: StreamAiCallbacks
): Promise<string> {
  const trimmedNewMessage = newMessage.trim();
  if (!trimmedNewMessage) {
    throw new Error('Message cannot be empty.');
  }

  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase AI Logic is not configured. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in web/.env to connect to Gemini.'
    );
  }

  const model = getGenerativeModelInstance();
  if (!model) {
    throw new Error(
      'Failed to initialize Firebase AI model instance. Please verify your Firebase project settings in web/.env.'
    );
  }

  // Sanitize history to guarantee strictly alternating (user -> model) pairs ending in 'model'
  const sanitizedHistory = sanitizeConversationHistory(history);

  // Check if we can safely reuse the in-memory chat session
  const canReuseSession =
    activeChatSession !== null &&
    isSessionClean &&
    sanitizedHistory.length > 0 &&
    sanitizedHistory.length === lastSessionHistoryLength;

  if (!canReuseSession) {
    resetActiveChatSession();

    const formattedHistory = sanitizedHistory.map((msg) => ({
      role: msg.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ type: 'text' as const, text: msg.text }],
    }));

    activeChatSession = model.startChat({
      history: formattedHistory,
    });
  }

  // Mark session dirty during in-flight generation
  isSessionClean = false;

  try {
    const requestOptions = callbacks.signal ? { signal: callbacks.signal } : undefined;
    const result = await activeChatSession!.sendMessageStream(trimmedNewMessage, requestOptions);

    let accumulatedText = '';

    for await (const chunk of result.stream) {
      if (callbacks.signal?.aborted) {
        break;
      }
      const chunkText = chunk.text();
      if (chunkText) {
        accumulatedText += chunkText;
        callbacks.onChunk(chunkText);
      }
    }

    // Check if operation was cancelled while reading the stream
    if (callbacks.signal?.aborted) {
      resetActiveChatSession();
      const abortErr = new Error('Request was cancelled.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    if (!accumulatedText || accumulatedText.trim().length === 0) {
      // Check response promise in case stream was buffered
      const fullResponse = await result.response;
      accumulatedText = fullResponse.text() || '';
      if (accumulatedText) {
        callbacks.onChunk(accumulatedText);
      }
    }

    if (callbacks.signal?.aborted) {
      resetActiveChatSession();
      const abortErr = new Error('Request was cancelled.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    if (!accumulatedText || accumulatedText.trim().length === 0) {
      resetActiveChatSession();
      throw new Error('Gemini returned an empty response. Please try rephrasing your question.');
    }

    // Stream finished successfully: session is now clean and synchronized
    isSessionClean = true;
    lastSessionHistoryLength = sanitizedHistory.length + 2;

    return accumulatedText.trim();
  } catch (err: any) {
    // ALWAYS invalidate cached session on error or cancellation,
    // because sendMessageStream already mutated the session's internal history with 'user'.
    resetActiveChatSession();

    if (err?.name === 'AbortError' || callbacks.signal?.aborted) {
      console.info('[NeedIt Firebase AI] Request was cancelled.');
      const abortErr = new Error('Request was cancelled.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    console.error('[NeedIt Firebase AI] Gemini streaming failure:', err);
    throw new Error(parseAiError(err));
  }
}

/**
 * Backward-compatible helper for non-streaming callers
 */
export async function sendCampusAiMessage(
  history: CampusChatMessage[],
  newMessage: string
): Promise<string> {
  return streamCampusAiMessage(history, newMessage, {
    onChunk: () => {},
  });
}

/**
 * Returns current runtime connectivity and configuration status
 */
export function getFirebaseAiStatus() {
  const recaptchaKey = getEnvVar('VITE_FIREBASE_RECAPTCHA_ENTERPRISE_KEY');
  const debugToken = getEnvVar('VITE_FIREBASE_APPCHECK_DEBUG_TOKEN');

  return {
    isConfigured: isFirebaseConfigured,
    isAppCheckInitialized: Boolean(appCheckInstance),
    hasRecaptchaKey: Boolean(recaptchaKey && recaptchaKey.trim() !== ''),
    hasDebugToken: Boolean(debugToken || isDevEnvironment()),
    model: AI_MODEL_NAME,
    provider: 'Gemini Developer API (GoogleAIBackend)',
    projectId: firebaseConfig.projectId || '(unconfigured)',
  };
}
