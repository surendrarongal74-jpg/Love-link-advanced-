export async function generateDailyQuestion(chatHistory: string[]): Promise<string> {
  try {
    const res = await fetch('/api/gemini/daily-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.question || "What's a small thing I did recently that made you smile?";
  } catch (err) {
    console.error("Failed to generate daily question", err);
    return "What's a small thing I did recently that made you smile?";
  }
}

export async function suggestMessages(context: string): Promise<string[]> {
  try {
    const res = await fetch('/api/gemini/suggest-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.suggestions || ["Thinking of you ❤️", "Hope you're having a good day!", "Can't wait to see you!"];
  } catch (err) {
    console.error("Failed to suggest messages", err);
    return ["Thinking of you ❤️", "Hope you're having a good day!", "Can't wait to see you!"];
  }
}

export async function generateLoveLanguageSuggestions(partnerLanguage: string): Promise<string[]> {
  try {
    const res = await fetch('/api/gemini/love-language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerLanguage }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.suggestions || ["Show them you care in a special way today."];
  } catch (err) {
    console.error("Failed to generate love language suggestions", err);
    return ["Show them you care in a special way today."];
  }
}

export async function analyzeMoodAndSuggestAction(myMood: string, partnerMood: string): Promise<{ title: string, description: string, messageSuggestion?: string }> {
  try {
    const res = await fetch('/api/gemini/analyze-mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myMood, partnerMood }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      title: data.title || "Check in with them",
      description: data.description || "Send a quick message to show you care.",
      messageSuggestion: data.messageSuggestion || "Thinking about you!"
    };
  } catch (err) {
    console.error("Failed to analyze mood and suggest action", err);
    return {
      title: "Check in with them",
      description: "Send a quick message to show you care.",
      messageSuggestion: "Thinking about you!"
    };
  }
}

export async function generateAiraGameContent<T = any>(
  gameType: string,
  level: number = 1,
  options?: { partnerName?: string; userName?: string; currentTopic?: string }
): Promise<T | null> {
  try {
    const res = await fetch('/api/aira/game-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameType,
        level,
        partnerName: options?.partnerName || 'Partner',
        userName: options?.userName || 'You',
        currentTopic: options?.currentTopic || 'general'
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.item as T;
  } catch (err) {
    console.error(`Failed to generate AIRA content for ${gameType}:`, err);
    return null;
  }
}

export interface VisionBoardIdea {
  title: string;
  description: string;
  category: string;
  targetYear: string;
  suggestedEmoji: string;
  imageUrl?: string;
}

export async function generateVisionBoardIdeas(
  category: string = 'All',
  existingThemes: string[] = [],
  partner1Name?: string,
  partner2Name?: string
): Promise<VisionBoardIdea[]> {
  try {
    const res = await fetch('/api/gemini/vision-board-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, existingThemes, partner1Name, partner2Name }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.ideas || [];
  } catch (err) {
    console.error("Failed to generate vision board ideas", err);
    return [];
  }
}
