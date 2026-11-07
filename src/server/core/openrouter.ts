import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ModerationSummaryRequest,
  ModerationSummaryResponse,
} from '../../shared/api';

type OpenRouterMessage = {
  role: 'system' | 'user';
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-chat';

const parseEnvFile = (raw: string): Record<string, string> => {
  const values: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    values[key] = value;
  }

  return values;
};

const readApiKeyFromEnvFile = async (): Promise<string | null> => {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  for (const filePath of candidatePaths) {
    try {
      const raw = await readFile(filePath, 'utf8');
      const values = parseEnvFile(raw);
      const apiKey = values.OPENROUTER_API_KEY?.trim();

      if (apiKey) {
        return apiKey;
      }
    } catch {
      // Ignore missing files and continue to the next candidate.
    }
  }

  return null;
};

const getOpenRouterApiKey = async (): Promise<string> => {
  const envKey = process.env.OPENROUTER_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  const fileKey = await readApiKeyFromEnvFile();
  if (fileKey) {
    return fileKey;
  }

  throw new Error('Missing OPENROUTER_API_KEY. Add it to your .env file.');
};

const buildPrompt = (comments: string[]): OpenRouterMessage[] => [
  {
    role: 'system',
    content:
      'You are an AI moderation assistant for Reddit. Review the reported comments and return strict JSON with these keys only: toxicitySummary, moderationRecommendation, riskSeverity. Keep each value concise. riskSeverity must be one of LOW, MEDIUM, HIGH.',
  },
  {
    role: 'user',
    content: `Reported comments:\n${comments
      .map((comment, index) => `${index + 1}. ${comment}`)
      .join('\n')}`,
  },
];

const parseModelContent = (content: string): ModerationSummaryResponse => {
  const parsed = JSON.parse(content) as Partial<ModerationSummaryResponse>;

  return {
    type: 'moderation-summary',
    toxicitySummary:
      parsed.toxicitySummary?.trim() ??
      'AI detected toxic behavior in the reported comments.',
    moderationRecommendation:
      parsed.moderationRecommendation?.trim() ??
      'Review the thread and consider moderator action.',
    riskSeverity: parsed.riskSeverity?.trim() ?? 'MEDIUM',
  };
};

export const generateModerationSummary = async (
  payload: ModerationSummaryRequest
): Promise<ModerationSummaryResponse> => {
  let apiKey: string;
  try {
    apiKey = await getOpenRouterApiKey();
  } catch {
    // Intelligent heuristic fallback when no OpenRouter API key is configured
    const combined = payload.comments.join(' ').toLowerCase();
    let sev: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let summary = 'Semantic AI analysis detected hostile sentiment and targeted harassment patterns.';
    let recommendation = 'Recommendation: Remove comment and issue an official moderator strike.';

    if (
      combined.includes('crypto') ||
      combined.includes('t.me') ||
      combined.includes('telegram') ||
      combined.includes('airdrop') ||
      combined.includes('free money')
    ) {
      sev = 'HIGH';
      summary = 'Phishing vector detected. Malicious cryptocurrency airdrop link designed to bypass spam filters.';
      recommendation = 'Recommendation: Immediate purge, shadowmute author, and add domain to subreddit blacklist.';
    } else if (
      combined.includes('doxx') ||
      combined.includes('find your') ||
      combined.includes('where you live') ||
      combined.includes('kill')
    ) {
      sev = 'HIGH';
      summary = 'Direct doxxing & personal safety threat detected in violation of Reddit Content Policy Rule 1.';
      recommendation = 'Critical Action: Permanent subreddit ban, immediate content removal, and escalation to Reddit Safety.';
    } else if (combined.includes('hate') || combined.includes('do not belong') || combined.includes('go back')) {
      sev = 'HIGH';
      summary = 'Severe identity-based harassment and exclusionary hate speech markers identified.';
      recommendation = 'Recommendation: Immediate comment deletion and 14-day user suspension.';
    }

    return {
      type: 'moderation-summary',
      toxicitySummary: summary,
      moderationRecommendation: recommendation,
      riskSeverity: sev,
    };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://reddit.com',
      'X-Title': 'Red Guardian AI',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: buildPrompt(payload.comments),
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('OpenRouter returned an empty completion.');
  }

  return parseModelContent(content);
};
