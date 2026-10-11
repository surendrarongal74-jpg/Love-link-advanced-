import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const generateLoveMessageCard = {
  name: "generateLoveMessageCard",
  description: "Display a special Love Message Card in the chat UI for the user to copy or send. Use this when the user asks for a love text or romantic paragraph.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      message: { type: Type.STRING, description: "The romantic message generated" }
    },
    required: ["message"]
  }
};

const generateDateIdeaCard = {
  name: "generateDateIdeaCard",
  description: "Display a special Date Idea Card in the chat UI. Use this when you suggest an actionable date plan.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      idea: { type: Type.STRING, description: "The step-by-step or detailed date idea" }
    },
    required: ["idea"]
  }
};

const generateGameCard = {
  name: "generateGameCard",
  description: "Display a special Game Card in the chat UI to start a game like Truth or Dare. Use this when you suggest playing a couples game.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      gameName: { type: Type.STRING, description: "The name of the game" }
    },
    required: ["gameName"]
  }
};

// API: AIRA Chat endpoint
app.post('/api/aira/chat', async (req, res) => {
  try {
    const { chatHistory, systemInstruction, isSmartMode } = req.body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'chatHistory array is required' });
    }

    const enhancedSystemInstruction = `${systemInstruction || 'You are AIRA, the warm, romantic AI companion for couples.'}

CRITICAL FORMATTING INSTRUCTIONS FOR SPECIAL CARDS:
- When you generate or suggest a love message/text for the partner, include:
[LOVE_MESSAGE: "Write the sweet message here"]
- When you suggest a date idea or itinerary, include:
[DATE_IDEA: "Write the full date idea and flow here"]
- When you suggest a couple game, include:
[GAME_CARD: "Game Name"]

You can include warm conversational text before or after these tags.`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: chatHistory,
        config: {
          systemInstruction: enhancedSystemInstruction,
          temperature: isSmartMode ? 0.9 : 0.7,
        }
      });
    } catch (err: any) {
      console.warn('Attempt with gemini-3.1-flash-lite failed, trying gemini-3.8-flash:', err?.message || err);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatHistory,
        config: {
          systemInstruction: enhancedSystemInstruction,
          temperature: isSmartMode ? 0.9 : 0.7,
        }
      });
    }

    let textContent = response.text || '';
    const functionCalls: any[] = [];

    // Parse [LOVE_MESSAGE: ...] tags
    const loveMatch = textContent.match(/\[LOVE_MESSAGE:\s*["']?([\s\S]*?)["']?\]/i);
    if (loveMatch) {
      functionCalls.push({
        name: 'generateLoveMessageCard',
        args: { message: loveMatch[1].trim() }
      });
      textContent = textContent.replace(loveMatch[0], '').trim();
    }

    // Parse [DATE_IDEA: ...] tags
    const dateMatch = textContent.match(/\[DATE_IDEA:\s*["']?([\s\S]*?)["']?\]/i);
    if (dateMatch) {
      functionCalls.push({
        name: 'generateDateIdeaCard',
        args: { idea: dateMatch[1].trim() }
      });
      textContent = textContent.replace(dateMatch[0], '').trim();
    }

    // Parse [GAME_CARD: ...] tags
    const gameMatch = textContent.match(/\[GAME_CARD:\s*["']?([\s\S]*?)["']?\]/i);
    if (gameMatch) {
      functionCalls.push({
        name: 'generateGameCard',
        args: { gameName: gameMatch[1].trim() }
      });
      textContent = textContent.replace(gameMatch[0], '').trim();
    }

    const candidate = response.candidates?.[0];
    const candidateContent = candidate?.content || { role: 'model', parts: [{ text: textContent }] };

    return res.json({
      text: textContent.trim(),
      functionCalls,
      candidateContent,
    });
  } catch (error: any) {
    console.error('Error in /api/aira/chat:', error);
    return res.json({
      text: "I'm right here with you! Let me know what romantic idea or question you have in mind 💕",
      functionCalls: [],
      candidateContent: { role: 'model', parts: [{ text: "I'm right here with you! Let me know what romantic idea or question you have in mind 💕" }] }
    });
  }
});

// API: Generate Text
app.post('/api/gemini/generate-text', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const config: any = {
      temperature: 0.7,
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config,
      });
    } catch (err: any) {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config,
      });
    }

    return res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/gemini/generate-text:', error);
    return res.json({ text: "You make every moment together special ❤️" });
  }
});

// API: Generate Daily Question
app.post('/api/gemini/daily-question', async (req, res) => {
  try {
    const { chatHistory = [] } = req.body;
    const prompt = `You are a relationship counselor AI. Based on the following recent chat messages between a couple, generate ONE deep, engaging, and romantic daily question for them to answer to strengthen their bond. If no chat history is provided, generate a random romantic question. Make it sound natural, not robotic. Make sure the question is short, punchy, and meaningful.

Chat History:
${Array.isArray(chatHistory) ? chatHistory.join('\n') : ''}

Output ONLY the question text. Nothing else.`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });
    } catch (err: any) {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });
    }

    const question = response.text?.trim() || "What's a small thing I did recently that made you smile?";
    return res.json({ question });
  } catch (error: any) {
    console.error('Error in /api/gemini/daily-question:', error);
    return res.json({ question: "What's a small thing I did recently that made you smile?" });
  }
});

// API: Suggest Messages
app.post('/api/gemini/suggest-messages', async (req, res) => {
  try {
    const { context } = req.body;
    const prompt = `You are an AI assisting a partner in a romantic relationship. The user wants to send a message but is feeling stuck. Based on the context below, generate 3 short, sweet, and comforting message suggestions they could send right now.

Context: ${context || 'Just checking in'}

Output JSON format with an array of strings in a 'suggestions' field.`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['suggestions']
          }
        }
      });
    } catch (err: any) {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['suggestions']
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      suggestions: parsed.suggestions || ["Thinking of you ❤️", "Hope you're having a good day!", "Can't wait to see you!"]
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/suggest-messages:', error);
    return res.json({
      suggestions: ["Thinking of you ❤️", "Hope you're having a good day!", "Can't wait to see you!"]
    });
  }
});

// API: Love Language Suggestions
app.post('/api/gemini/love-language', async (req, res) => {
  try {
    const { partnerLanguage } = req.body;
    const prompt = `You are a relationship advice AI. The user's partner has the primary love language of "${partnerLanguage || 'Quality Time'}".
Generate 3 specific, creative, and action-oriented suggestions for how the user can show love to their partner today.
Make them brief and romantic.
Output ONLY JSON in this format:
{"suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['suggestions']
          }
        }
      });
    } catch (err: any) {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['suggestions']
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      suggestions: parsed.suggestions || ["Show them you care in a special way today."]
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/love-language:', error);
    return res.json({
      suggestions: ["Show them you care in a special way today."]
    });
  }
});

// API: Analyze Mood and Suggest Action
app.post('/api/gemini/analyze-mood', async (req, res) => {
  const { myMood = 'Happy', partnerMood = 'Happy' } = req.body || {};

  // Smart fallback dictionary based on moods
  const getFallback = (m1: string, m2: string) => {
    const lower = `${m1} ${m2}`.toLowerCase();
    if (lower.includes('sad') || lower.includes('down') || lower.includes('hurt')) {
      return {
        title: "Gentle Comfort",
        description: "Send a warm loving reassurance or ask if they'd like a call.",
        messageSuggestion: "Hey love, just wanted to remind you that I'm here for you no matter what ❤️"
      };
    }
    if (lower.includes('tired') || lower.includes('stressed') || lower.includes('busy')) {
      return {
        title: "Offer Gentle Relaxation",
        description: "Give them space or offer to take care of dinner/chores today.",
        messageSuggestion: "You worked so hard today! Rest well, thinking of you always 💕"
      };
    }
    if (lower.includes('romantic') || lower.includes('in love') || lower.includes('sweet')) {
      return {
        title: "Romantic Surprise",
        description: "Write down your favorite recent memory together and share it.",
        messageSuggestion: "I was just smiling thinking about our time together earlier 🥰"
      };
    }
    return {
      title: "Celebrate Your Connection",
      description: "Both of you are in good spirits! Plan something fun or share a laugh.",
      messageSuggestion: "Sending you a quick smile! Can't wait to see you ❤️"
    };
  };

  try {
    const prompt = `You are an emotional intelligence AI. Analyze these two moods from a couple:
My Mood: ${myMood}
Partner's Mood: ${partnerMood}

What is one recommended action to improve or celebrate their connection? Keep it very brief, romantic, and gentle.
Output as JSON with:
- title: A short title for the action
- description: A slightly longer description
- messageSuggestion: A short text message the user could send (optional)`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              messageSuggestion: { type: Type.STRING }
            },
            required: ['title', 'description']
          }
        }
      });
    } catch (err: any) {
      console.warn('Primary mood analysis failed, trying gemini-3.8-flash:', err?.message || err);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              messageSuggestion: { type: Type.STRING }
            },
            required: ['title', 'description']
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    const fallback = getFallback(myMood, partnerMood);
    return res.json({
      title: parsed.title || fallback.title,
      description: parsed.description || fallback.description,
      messageSuggestion: parsed.messageSuggestion || fallback.messageSuggestion
    });
  } catch (error: any) {
    console.warn('Graceful fallback used for /api/gemini/analyze-mood:', error?.message || error);
    const fallback = getFallback(myMood, partnerMood);
    return res.json(fallback);
  }
});

// Health check endpoint for Cloud Run and container orchestration
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

async function startServer() {
  const isDev = process.env.NODE_ENV === 'development';
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  if (!isDev && hasDist) {
    // Production / Deployed environment: serve pre-built static bundle
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`Serving static assets from ${distPath}`);
  } else {
    // Development environment: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running in Vite development mode');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
