import { apiFetch, apiPostJson, ApiError, friendlyApiMessage } from './api';
export type TextTask = 'date-idea' | 'reply-suggestions' | 'vibe-check';

/**
 * Ask the server to run one of a fixed set of AI text tasks. The server builds the prompt;
 * the client only sends typed parameters. Throws ApiError (with a friendly message) on failure.
 */
export async function generateTextTask(task: TextTask, params: Record<string, unknown>): Promise<string> {
  const data = await apiPostJson<{ text?: string }>('/api/gemini/generate-text', { task, params });
  return data.text || '';
}

export async function generateDatePlan(
  preferences: Record<string, any>,
  coupleHistory: { partnerName?: string; userName?: string; anniversaryDate?: string },
  pastSuccessfulSurprises: any[] = []
): Promise<any> {
  try {
    const res = await apiFetch('/api/gemini/generate-date-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferences,
        coupleHistory,
        pastSuccessfulSurprises,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.error || `http_${res.status}`, friendlyApiMessage(res.status, body?.error, body?.message));
    }

    const data = await res.json();
    return data.plan;
  } catch (error) {
    console.error('Error generating date plan:', error);
    throw error;
  }
}

export async function generateRandomDateNight(
  location: { city: string; neighborhood?: string; settingType?: string },
  preferences: {
    vibe?: string;
    budget?: string;
    energyLevel?: string;
    timeOfDay?: string;
    dietary?: string;
    indoorOutdoor?: string;
    wildcard?: boolean;
  },
  coupleContext?: {
    userName?: string;
    partnerName?: string;
    pastDatesLiked?: string[];
  }
): Promise<any> {
  try {
    const res = await apiFetch('/api/gemini/random-date-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        preferences,
        coupleContext,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body?.error || `http_${res.status}`, friendlyApiMessage(res.status, body?.error, body?.message));
    }

    const data = await res.json();
    return data.dateNight;
  } catch (error) {
    console.error('Error generating random date night:', error);
    throw error;
  }
}
