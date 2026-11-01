export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.text || '';
  } catch (error) {
    console.error('Error generating AI text:', error);
    throw error;
  }
}

export async function generateDatePlan(
  preferences: Record<string, any>,
  coupleHistory: { partnerName?: string; userName?: string; anniversaryDate?: string },
  pastSuccessfulSurprises: any[] = []
): Promise<any> {
  try {
    const res = await fetch('/api/gemini/generate-date-plan', {
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
      throw new Error(`Server returned ${res.status}`);
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
    const res = await fetch('/api/gemini/random-date-generator', {
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
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data.dateNight;
  } catch (error) {
    console.error('Error generating random date night:', error);
    throw error;
  }
}
