import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// CORS & iFrame compatibility headers for AI Studio preview
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// API: AIRA Generate Game Questions and Challenges
app.post('/api/aira/game-content', async (req, res) => {
  try {
    const { gameType, level = 1, currentTopic = 'general', partnerName = 'Partner', userName = 'You' } = req.body;
    if (!gameType) {
      return res.status(400).json({ error: 'gameType is required' });
    }

    const systemPrompt = `You are AIRA, the intelligent, romantic, witty couples game creator inside Love Link.
Generate fresh, fun, high-engagement content for couples games.
Make them tailored to Level ${level}.
Keep the questions creative, modern, spicy yet wholesome, intimate, and never repetitive.`;

    let specificPrompt = '';
    let responseSchema: any = null;

    if (gameType === 'draw-guess') {
      specificPrompt = `Generate a creative secret word or short phrase for a couple's "Draw It, Guess It" game at Level ${level}.
Category/Vibe: Romantic, funny, inside joke, daily couple life, cute items, dream dates.
Output JSON: { "word": "string", "hint": "string", "difficulty": "easy"|"medium"|"hard" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          hint: { type: Type.STRING },
          difficulty: { type: Type.STRING }
        },
        required: ['word', 'hint']
      };
    } else if (gameType === 'couples-trivia') {
      specificPrompt = `Generate 1 unique, fun couple trivia multiple choice question for Level ${level}.
Focus on couple habits, cute relationship dilemmas, favorite date scenarios, or personality quirks.
Provide 4 plausible choices with the correct option index (0-3).
Output JSON: { "q": "string", "options": ["option 0", "option 1", "option 2", "option 3"], "correct": 0 }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          q: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct: { type: Type.INTEGER }
        },
        required: ['q', 'options', 'correct']
      };
    } else if (gameType === 'would-you-rather') {
      specificPrompt = `Generate 1 compelling, fun, romantic or spicy "Would You Rather" dilemma for Level ${level}.
Option A and Option B should both be intriguing, thought-provoking, and spark playful debate between partners.
Output JSON: { "optionA": "string", "optionB": "string", "category": "string" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          optionA: { type: Type.STRING },
          optionB: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ['optionA', 'optionB']
      };
    } else if (gameType === 'guess-answer') {
      specificPrompt = `Generate 1 "Guess My Answer" prompt for Level ${level}.
The question should have 4 sweet or fun multiple-choice answers for one partner to pick and the other to predict.
Output JSON: { "question": "string", "category": "Romantic"|"Quirky"|"Deep"|"Naughty", "options": ["string", "string", "string", "string"] }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          category: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['question', 'category', 'options']
      };
    } else if (gameType === 'emoji-decoder') {
      specificPrompt = `Generate 1 fun "Emoji Cipher" for Level ${level} where emojis represent a secret couple activity, romantic movie, or sweet date scenario.
Output JSON: { "emoji": "string (4-5 emojis with spaces)", "answer": "string (readable english answer)", "hint": "string (a helpful clue)" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          answer: { type: Type.STRING },
          hint: { type: Type.STRING }
        },
        required: ['emoji', 'answer', 'hint']
      };
    } else if (gameType === 'two-hearts-mystery') {
      specificPrompt = `Generate Chapter ${level} for the "Two Hearts Mystery" escape adventure.
Two partners receive different clues (Partner A Clue and Partner B Clue) that must be combined to find the riddle answer.
Output JSON: {
  "title": "string",
  "location": "string",
  "storyIntro": "string",
  "partnerAClue": "string",
  "partnerBClue": "string",
  "riddleQuestion": "string",
  "solutionCode": "string (uppercase code or word without spaces)",
  "epilogue": "string"
}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          location: { type: Type.STRING },
          storyIntro: { type: Type.STRING },
          partnerAClue: { type: Type.STRING },
          partnerBClue: { type: Type.STRING },
          riddleQuestion: { type: Type.STRING },
          solutionCode: { type: Type.STRING },
          epilogue: { type: Type.STRING }
        },
        required: ['title', 'location', 'storyIntro', 'partnerAClue', 'partnerBClue', 'riddleQuestion', 'solutionCode', 'epilogue']
      };
    } else if (gameType === 'truth-or-dare') {
      specificPrompt = `Generate 1 fresh, romantic, flirty, or fun Truth and 1 Dare suited for Level ${level}.
Output JSON: { "truth": "string", "dare": "string" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          truth: { type: Type.STRING },
          dare: { type: Type.STRING }
        },
        required: ['truth', 'dare']
      };
    } else if (gameType === 'who-loves-more') {
      specificPrompt = `Generate 1 playful, funny, and endearing "Who is more likely to..." or "Who does..." question for a couple to vote on at Level ${level}.
Output JSON: { "question": "string" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING }
        },
        required: ['question']
      };
    } else if (gameType === 'couple-quiz') {
      specificPrompt = `Generate 1 deep, bonding daily quiz question for the couple game screen at Level ${level}.
Output JSON: { "question": "string" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING }
        },
        required: ['question']
      };
    } else if (gameType === 'rhythm-sync') {
      specificPrompt = `Generate 1 unique Level ${level} Rhythm Wave Sync challenge for a couple.
The challenge should have a romantic song theme, a target BPM tempo between 60 and 128, a catchy love lyric cue, and a target synchronization score threshold.
Output JSON: {
  "songTitle": "string",
  "artistStyle": "string",
  "bpm": 80,
  "lyricCue": "string",
  "targetSyncPercent": 85,
  "romanticReward": "string"
}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          songTitle: { type: Type.STRING },
          artistStyle: { type: Type.STRING },
          bpm: { type: Type.INTEGER },
          lyricCue: { type: Type.STRING },
          targetSyncPercent: { type: Type.INTEGER },
          romanticReward: { type: Type.STRING }
        },
        required: ['songTitle', 'bpm', 'lyricCue', 'targetSyncPercent', 'romanticReward']
      };
    } else if (gameType === 'constellation-puzzle') {
      specificPrompt = `Generate Level ${level} for the "Constellation Connect" co-op puzzle game.
Two partners connect star nodes across a celestial grid to reveal a hidden symbol or memory.
Output JSON: {
  "constellationName": "string",
  "storySnippet": "string",
  "nodesCount": 6,
  "secretKeyword": "string",
  "partnerClueA": "string",
  "partnerClueB": "string"
}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          constellationName: { type: Type.STRING },
          storySnippet: { type: Type.STRING },
          nodesCount: { type: Type.INTEGER },
          secretKeyword: { type: Type.STRING },
          partnerClueA: { type: Type.STRING },
          partnerClueB: { type: Type.STRING }
        },
        required: ['constellationName', 'storySnippet', 'nodesCount', 'secretKeyword', 'partnerClueA', 'partnerClueB']
      };
    } else {
      specificPrompt = `Generate 1 creative romantic question or prompt for Level ${level}. Output JSON: { "content": "string" }`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING }
        },
        required: ['content']
      };
    }

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: specificPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    } catch (err: any) {
      console.warn('Fallback to gemini-3.8-flash for /api/aira/game-content:', err?.message || err);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: specificPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, item: parsed });
  } catch (error: any) {
    console.error('Error in /api/aira/game-content:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate game content' });
  }
});

// API: AI Vision Board Ideas & Goal Generator
app.post('/api/gemini/vision-board-ideas', async (req, res) => {
  try {
    const { existingThemes = [], category = 'All', partner1Name = 'Partner 1', partner2Name = 'Partner 2' } = req.body;

    const prompt = `You are AIRA, an inspiring, empathetic couples life planner and vision architect.
The couple (${partner1Name} & ${partner2Name}) is building their Shared Vision Board for their future together.
Category focus: "${category}".
Existing dreams / goals: ${Array.isArray(existingThemes) && existingThemes.length > 0 ? existingThemes.join(', ') : 'Travel the world, build a cozy home, adopt a pet, achieve financial freedom'}.

Generate 4 creative, inspiring, concrete, and deeply romantic collaborative vision board ideas for their future.
Each idea should include:
- title: concise, exciting name (e.g. "Sunset Cabin in the Pacific Northwest")
- description: vivid, motivating 1-2 sentence description of what the experience or goal looks like together
- category: one of ["Travel & Adventures", "Home & Sanctuary", "Life Milestones", "Personal Growth", "Fun & Quirky", "Financial & Career"]
- targetYear: an estimated timeline (e.g., "Within 1 Year", "2-3 Years", "5 Years", "Someday Dream")
- suggestedEmoji: a single fitting emoji (e.g. "🏡", "✈️", "🐕", "💍", "🏔️", "☕")
- imageUrl: a high-quality relevant Unsplash image URL matching the theme (use standard photo keywords)

Output JSON only in this format:
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "category": "...",
      "targetYear": "...",
      "suggestedEmoji": "...",
      "imageUrl": "..."
    }
  ]
}`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    targetYear: { type: Type.STRING },
                    suggestedEmoji: { type: Type.STRING },
                    imageUrl: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'category', 'targetYear', 'suggestedEmoji']
                }
              }
            },
            required: ['ideas']
          }
        }
      });
    } catch (err: any) {
      console.warn('Fallback to gemini-3.8-flash for vision-board-ideas:', err?.message || err);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    targetYear: { type: Type.STRING },
                    suggestedEmoji: { type: Type.STRING },
                    imageUrl: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'category', 'targetYear', 'suggestedEmoji']
                }
              }
            },
            required: ['ideas']
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ideas: parsed.ideas || [] });
  } catch (error: any) {
    console.error('Error in /api/gemini/vision-board-ideas:', error);
    return res.status(500).json({
      success: false,
      ideas: [
        {
          title: "Starlit Campervan Road Trip",
          description: "Rent a vintage campervan, drive up the scenic coast, and sleep under meteor showers together.",
          category: "Travel & Adventures",
          targetYear: "Next Summer",
          suggestedEmoji: "🚐",
          imageUrl: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Sun-drenched Reading Nook",
          description: "Design a shared corner with plush floor pillows, plant cuttings, and our favorite books side by side.",
          category: "Home & Sanctuary",
          targetYear: "Within 1 Year",
          suggestedEmoji: "🌿",
          imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Learn Italian & Cook in Tuscany",
          description: "Take online cooking lessons together, then book a farmhouse stay to make fresh pasta from scratch.",
          category: "Personal Growth",
          targetYear: "2-3 Years",
          suggestedEmoji: "🍝",
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
        },
        {
          title: "Sunrise Hot Air Balloon Ride",
          description: "Drift quietly over misty valleys at dawn holding hot coffee and each other's hands.",
          category: "Fun & Quirky",
          targetYear: "Next Anniversary",
          suggestedEmoji: "🎈",
          imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
        }
      ]
    });
  }
});

// API: AI Love Coupon Generator
app.post('/api/gemini/love-coupons-ideas', async (req, res) => {
  try {
    const { partnerName = 'Partner', category = 'All', loveLanguage = 'Quality Time' } = req.body;

    const prompt = `You are AIRA, the romantic love concierge for couples in Love Link.
Generate 4 unique, creative, high-value, and heartwarming Love Coupons that one partner can gift or redeem with their lover.
Recipient: ${partnerName}
Preferred love language: ${loveLanguage}
Coupon category: ${category}

Examples:
- "15-Minute Head & Scalp Massage with Zero Distractions"
- "Breakfast in Bed + Favorite Iced Latte on a Lazy Sunday"
- "Pass: You Choose Whatever Movie/Show We Watch Tonight"
- "Midnight Drive & Stargazing Ice Cream Run"
- "One Uninterrupted 30-Minute Vent Session with Deep Listening & Warm Hugs"

Output JSON only in this schema:
{
  "coupons": [
    {
      "title": "string",
      "description": "string",
      "category": "Sweet Gestures" | "Romantic Dates" | "Playful Favors" | "Custom Wagers",
      "tokenCost": number (between 50 and 250),
      "emoji": "string",
      "terms": "string"
    }
  ]
}`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coupons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    tokenCost: { type: Type.INTEGER },
                    emoji: { type: Type.STRING },
                    terms: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'category', 'tokenCost', 'emoji']
                }
              }
            },
            required: ['coupons']
          }
        }
      });
    } catch (err: any) {
      console.warn('Fallback to gemini-3.8-flash for /api/gemini/love-coupons-ideas:', err?.message || err);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coupons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    tokenCost: { type: Type.INTEGER },
                    emoji: { type: Type.STRING },
                    terms: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'category', 'tokenCost', 'emoji']
                }
              }
            },
            required: ['coupons']
          }
        }
      });
    }

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, coupons: parsed.coupons || [] });
  } catch (error: any) {
    console.error('Error in /api/gemini/love-coupons-ideas:', error);
    return res.status(500).json({
      success: false,
      coupons: [
        {
          title: "15-Minute Head & Scalp Massage",
          description: "Relax completely with soothing music and gentle scalp massage.",
          category: "Sweet Gestures",
          tokenCost: 100,
          emoji: "💆‍♀️",
          terms: "Redeemable anytime after a long day."
        },
        {
          title: "Ultimate Lazy Sunday Breakfast in Bed",
          description: "I will make your favorite pancakes or eggs with fresh coffee delivered to bed.",
          category: "Romantic Dates",
          tokenCost: 150,
          emoji: "🥞",
          terms: "Valid on any weekend morning."
        },
        {
          title: "Movie & Snack Dictator Pass",
          description: "You choose the movie, the couch snacks, and the blanket fortress tonight.",
          category: "Playful Favors",
          tokenCost: 75,
          emoji: "🍿",
          terms: "No complaints allowed from partner!"
        },
        {
          title: "Late Night Spontaneous Dessert Run",
          description: "Pack into the car in our comfy clothes for milkshakes or warm cookies.",
          category: "Romantic Dates",
          tokenCost: 120,
          emoji: "🍨",
          terms: "Valid between 9 PM and midnight."
        }
      ]
    });
  }
});

// ==========================================
// LOVE COINS & DIGITAL ECONOMY AUTHORITATIVE API
// ==========================================

export interface ServerUserWallet {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  dailyEarnedToday: number;
  lastEarnDate: string;
  maxDailyQuota: number;
  streakDays?: number;
  lastCheckInDate?: string;
  updatedAt: number;
}

export interface ServerUserInventory {
  userId: string;
  ownedThemes: string[];
  activeTheme: string;
  ownedBadges: string[];
  equippedBadge: string;
  ownedGamePacks: string[];
  streakFreezeTokens: number;
  updatedAt: number;
}

export interface ServerCoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'mission_reward' | 'referral_bonus' | 'virtual_gift' | 'item_purchase' | 'coupon_redeem' | 'daily_checkin';
  description: string;
  referenceId?: string;
  createdAt: number;
}

export interface MissionDefinition {
  id: string;
  title: string;
  category: 'daily' | 'weekly';
  coinsReward: number;
  description: string;
  proofType: 'photo' | 'text';
  promptHint: string;
  cooldownHours: number;
}

const MISSIONS_CATALOG: MissionDefinition[] = [
  {
    id: 'mission_love_note',
    title: 'Handwritten Love Note',
    category: 'daily',
    coinsReward: 50,
    description: 'Write a sweet physical note to your partner and take a photo of it.',
    proofType: 'photo',
    promptHint: 'Upload a photo showing your handwritten note with warm words.',
    cooldownHours: 12
  },
  {
    id: 'mission_reflection',
    title: 'Mindful Gratitude Reflection',
    category: 'daily',
    coinsReward: 35,
    description: 'Write 3 heartfelt sentences describing a small moment your partner made your day brighter.',
    proofType: 'text',
    promptHint: 'Write at least 3 sentences of authentic gratitude for your partner.',
    cooldownHours: 8
  },
  {
    id: 'mission_meal_together',
    title: 'Cook or Share a Meal',
    category: 'daily',
    coinsReward: 60,
    description: 'Share a homemade dinner or dessert with your partner.',
    proofType: 'photo',
    promptHint: 'Upload a picture of the food, coffee, or dessert plate you shared.',
    cooldownHours: 18
  },
  {
    id: 'mission_sunset_stroll',
    title: 'Sunset Walk or Outdoor Date',
    category: 'weekly',
    coinsReward: 100,
    description: 'Step outside together for a sunset walk, park stroll, or scenic view.',
    proofType: 'photo',
    promptHint: 'Upload a photo of the scenery, path, or a couple selfie outside.',
    cooldownHours: 36
  },
  {
    id: 'mission_memory_scrapbook',
    title: 'Milestone Scrapbook Entry',
    category: 'weekly',
    coinsReward: 90,
    description: 'Upload a meaningful throwback photo or ticket stub with a heartfelt reflection.',
    proofType: 'photo',
    promptHint: 'Upload the photo/memory and write why it is unforgettable.',
    cooldownHours: 48
  },
  {
    id: 'mission_surprise_date',
    title: 'Spontaneous Surprise Date Execution',
    category: 'weekly',
    coinsReward: 150,
    description: 'Plan and execute a sweet surprise date or thoughtful romantic favor for your partner.',
    proofType: 'photo',
    promptHint: 'Upload a photo or write detailed proof of the surprise experience.',
    cooldownHours: 72
  }
];

const SHOP_CATALOG = [
  // Virtual Romantic Gifts (Gift Garden)
  {
    id: 'gift_single_rose',
    name: 'Single Rose',
    category: 'gifts',
    cost: 50,
    description: 'A velvet red rose with dewdrops and a gilded stem to show your tender affection.',
    icon: '🌹',
    image: '/src/assets/images/gift_single_rose_1791977103530.jpg'
  },
  {
    id: 'gift_love_letter',
    name: 'Love Letter',
    category: 'gifts',
    cost: 75,
    description: 'A sealed wax-stamp vintage envelope that delivers your custom heartfelt message.',
    icon: '💌',
    image: '/src/assets/images/gift_love_letter_1791977158702.jpg'
  },
  {
    id: 'gift_cuddle_teddy',
    name: 'Cuddle Teddy',
    category: 'gifts',
    cost: 100,
    description: 'A fluffy plush teddy bear holding a glowing heart that bounces into your partner\'s chat.',
    icon: '🧸',
    image: '/src/assets/images/gift_cuddle_teddy_1791976822448.jpg'
  },
  {
    id: 'gift_heart_cake',
    name: 'Heart Cake',
    category: 'gifts',
    cost: 150,
    description: 'A gourmet strawberry cream cake with sparkler candles to sweeten their day.',
    icon: '🎂',
    image: '/src/assets/images/gift_heart_cake_1791976879124.jpg'
  },
  {
    id: 'gift_bouquet_roses',
    name: 'Bouquet of Love',
    category: 'gifts',
    cost: 200,
    description: 'A beautiful bouquet of roses with a magical petal animation in your partner\'s chat.',
    icon: '💐',
    image: '/src/assets/images/gift_bouquet_roses_1791976799394.jpg'
  },
  {
    id: 'gift_crystal_heart',
    name: 'Crystal Heart',
    category: 'gifts',
    cost: 300,
    description: 'A radiant winged crystal gemstone that sparkles with glowing starlight refractions.',
    icon: '💎',
    image: '/src/assets/images/gift_crystal_heart_1791976847630.jpg'
  },
  {
    id: 'gift_dream_castle',
    name: 'Dream Castle',
    category: 'gifts',
    cost: 2000,
    description: 'A floating fairy-tale cloud castle keepsake reserved for extraordinary milestones.',
    icon: '🏰',
    image: '/src/assets/images/theme_cloud_romance_1791977048928.jpg'
  },
  {
    id: 'gift_heart_fireworks',
    name: 'Heart Fireworks',
    category: 'gifts',
    cost: 3500,
    description: 'A screen-wide romantic fireworks show that illuminates your couple space.',
    icon: '🎆',
    image: '/src/assets/images/theme_royal_hearts_1791977003556.jpg'
  },
  {
    id: 'gift_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    category: 'gifts',
    cost: 7500,
    description: 'A legendary cosmic stardust spectacle celebrating unbreakable eternal love.',
    icon: '🌌',
    image: '/src/assets/images/theme_soulmate_galaxy_1791976959294.jpg'
  },
  {
    id: 'gift_rose_shower',
    name: 'Starlit Rose Shower',
    category: 'gifts',
    cost: 40,
    description: 'Floating animated rose petals and sweet chime in your partner\'s chat.',
    icon: '🌹'
  },
  {
    id: 'gift_infinite_hug',
    name: 'Infinite Hug Teddy',
    category: 'gifts',
    cost: 60,
    description: 'Bouncing cuddly teddy bear animation with heart bursts.',
    icon: '🧸'
  },
  {
    id: 'gift_fireworks',
    name: 'Champagne Fireworks',
    category: 'gifts',
    cost: 90,
    description: 'Screen-wide celebration fireworks effect with chime.',
    icon: '🎆'
  },

  // App Themes (Dream Skies)
  {
    id: 'theme_blush_romance',
    name: 'Blush Romance',
    category: 'themes',
    cost: 0,
    description: 'Classic romantic blush pink & creamy velvet highlights (Free starter).',
    icon: '🌸',
    previewColor: '#F2A7BE'
  },
  {
    id: 'theme_cloud_romance',
    name: 'Cloud Romance',
    category: 'themes',
    cost: 500,
    description: 'Soft pink clouds, floating hearts and a dreamy fairy sky that makes every chat magical.',
    icon: '☁️',
    previewColor: '#F2A7BE'
  },
  {
    id: 'theme_moonlight_sky',
    name: 'Moonlight Dreams',
    category: 'themes',
    cost: 1000,
    description: 'Calming twilight sky with golden crescent moon and twinkling starlight.',
    icon: '🌙',
    previewColor: '#8B5CF6'
  },
  {
    id: 'theme_royal_hearts',
    name: 'Royal Hearts',
    category: 'themes',
    cost: 2500,
    description: 'Majestic fairytale palace hallway with glowing grand golden heart arches.',
    icon: '👑',
    previewColor: '#E11D48'
  },
  {
    id: 'theme_soulmate_galaxy',
    name: 'Soulmate Galaxy',
    category: 'themes',
    cost: 5000,
    description: 'A magical cosmic nebula made for two hearts in deep celestial space.',
    icon: '🌌',
    previewColor: '#9333EA'
  },
  {
    id: 'theme_starlit_lavender',
    name: 'Starlit Lavender',
    category: 'themes',
    cost: 200,
    description: 'Dreamy stardust dusk purple with soft lavender glow.',
    icon: '✨',
    previewColor: '#7C3AED'
  },
  {
    id: 'theme_sunset_velvet',
    name: 'Sunset Velvet',
    category: 'themes',
    cost: 250,
    description: 'Golden peach glow and warm sunset coral intimacy.',
    icon: '🌅',
    previewColor: '#F97316'
  },

  // Badges & Frames (Constellation Collection)
  {
    id: 'badge_true_devotion',
    name: 'True Devotion',
    category: 'badges',
    cost: 100,
    description: 'A radiant golden winged heart emblem displayed beside your nickname.',
    icon: '💖',
    badgeLabel: '💖 True Devotion'
  },
  {
    id: 'badge_forever_together',
    name: 'Forever Together',
    category: 'badges',
    cost: 150,
    description: 'An infinity heart crest commemorating your continuous journey as soulmates.',
    icon: '♾️',
    badgeLabel: '♾️ Forever'
  },
  {
    id: 'badge_love_explorer',
    name: 'Love Explorer',
    category: 'badges',
    cost: 200,
    description: 'Awarded to adventurous couples discovering new activities in the Loveverse.',
    icon: '⭐',
    badgeLabel: '⭐ Explorer'
  },
  {
    id: 'badge_streak_master',
    name: 'Streak Master',
    category: 'badges',
    cost: 250,
    description: 'A flaming winged heart badge honoring dedication to daily connection.',
    icon: '🔥',
    badgeLabel: '🔥 Streak Master'
  },
  {
    id: 'badge_memory_keeper',
    name: 'Memory Keeper',
    category: 'badges',
    cost: 300,
    description: 'A charming vintage camera badge celebrating couples who treasure memories.',
    icon: '📸',
    badgeLabel: '📸 Keeper'
  },
  {
    id: 'badge_aira_friend',
    name: 'AIRA Companion',
    category: 'badges',
    cost: 400,
    description: 'An exclusive glowing holographic crest granted to lovers guided by AIRA.',
    icon: '🤖',
    badgeLabel: '✨ AIRA Loved'
  },
  {
    id: 'badge_golden_heart',
    name: 'Golden Heart Badge',
    category: 'badges',
    cost: 80,
    description: 'Gleaming golden heart icon displayed next to your name across the app.',
    icon: '💛',
    badgeLabel: '💛 True Devotion'
  },
  {
    id: 'frame_golden_frame',
    name: 'Golden Frame',
    category: 'badges',
    cost: 350,
    description: 'An exquisite baroque golden heart frame adorned with pearls for your profile photo.',
    icon: '🖼️',
    badgeLabel: 'Golden Frame'
  },
  {
    id: 'frame_celestial_frame',
    name: 'Celestial Frame',
    category: 'badges',
    cost: 500,
    description: 'A shimmering starlight halo frame with miniature orbiting constellation stars.',
    icon: '✨',
    badgeLabel: 'Celestial Halo'
  },
  {
    id: 'frame_royal_frame',
    name: 'Royal Frame',
    category: 'badges',
    cost: 750,
    description: 'A majestic golden crown and ruby heart wreath framing your couple portrait.',
    icon: '👑',
    badgeLabel: 'Royal Wreath'
  },
  {
    id: 'frame_polaroid_gold',
    name: 'Polaroid Gold Frame',
    category: 'badges',
    cost: 100,
    description: 'Lustrous golden metallic styling for photos in Memories & Milestones.',
    icon: '🖼️',
    badgeLabel: 'Golden Memories'
  },
  {
    id: 'token_streak_freeze',
    name: 'Streak Freeze Shield',
    category: 'badges',
    cost: 120,
    description: 'Consumable token that automatically shields your streak if a day is missed.',
    icon: '🛡️',
    badgeLabel: 'Streak Shield'
  },

  // Game Content Unlocks
  {
    id: 'pack_deep_intimacy',
    name: 'Truth or Dare: Deep Vulnerability Pack',
    category: 'game_packs',
    cost: 100,
    description: '40 new deep emotional & intimacy questions to explore with your partner.',
    icon: '🔥'
  },
  {
    id: 'pack_romantic_date_roulette',
    name: 'Date Planner: Adventure Roulette Pack',
    category: 'game_packs',
    cost: 120,
    description: '30 spontaneous couples adventure prompts and date night ideas.',
    icon: '🎲'
  }
];

const DAILY_MAX_COINS_QUOTA = 250;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'coins_economy.json');

interface CoinsEconomyState {
  wallets: Record<string, ServerUserWallet>;
  inventories: Record<string, ServerUserInventory>;
  transactions: ServerCoinTransaction[];
  submittedHashes: Record<string, { userId: string; timestamp: number; missionId: string }>;
  claimedReferrals: Record<string, string>;
  recentMissionCompletions: Record<string, number>;
}

class CoinsEconomyManager {
  private state: CoinsEconomyState = {
    wallets: {},
    inventories: {},
    transactions: [],
    submittedHashes: {},
    claimedReferrals: {},
    recentMissionCompletions: {}
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.state = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error loading coins economy state, initializing fresh state:', err);
    }
  }

  private saveState() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save coins economy state:', err);
    }
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  public getOrCreateWallet(userId: string): ServerUserWallet {
    const today = this.getTodayString();
    if (!this.state.wallets[userId]) {
      this.state.wallets[userId] = {
        userId,
        balance: 50,
        totalEarned: 50,
        totalSpent: 0,
        dailyEarnedToday: 0,
        lastEarnDate: today,
        maxDailyQuota: DAILY_MAX_COINS_QUOTA,
        updatedAt: Date.now()
      };
      this.saveState();
    } else {
      const wallet = this.state.wallets[userId];
      if (wallet.lastEarnDate !== today) {
        wallet.dailyEarnedToday = 0;
        wallet.lastEarnDate = today;
        wallet.updatedAt = Date.now();
        this.saveState();
      }
    }
    return this.state.wallets[userId];
  }

  public getOrCreateInventory(userId: string): ServerUserInventory {
    if (!this.state.inventories[userId]) {
      this.state.inventories[userId] = {
        userId,
        ownedThemes: ['theme_cloud_romance', 'theme_blush_romance'],
        activeTheme: 'theme_cloud_romance',
        ownedBadges: [],
        equippedBadge: '',
        ownedGamePacks: [],
        streakFreezeTokens: 0,
        updatedAt: Date.now()
      };
      this.saveState();
    }
    return this.state.inventories[userId];
  }

  public getWalletSummary(userId: string) {
    const wallet = this.getOrCreateWallet(userId);
    const inventory = this.getOrCreateInventory(userId);
    const userTransactions = this.state.transactions
      .filter(t => t.userId === userId)
      .slice(-30)
      .reverse();

    const dailyRemainingQuota = Math.max(0, DAILY_MAX_COINS_QUOTA - wallet.dailyEarnedToday);

    return {
      wallet,
      inventory,
      transactions: userTransactions,
      dailyRemainingQuota,
      missions: MISSIONS_CATALOG.map(m => {
        const lastDone = this.state.recentMissionCompletions[`${userId}_${m.id}`] || 0;
        const cooldownMs = m.cooldownHours * 60 * 60 * 1000;
        const canSubmit = Date.now() - lastDone >= cooldownMs;
        const nextAvailableInHours = canSubmit ? 0 : Math.ceil((cooldownMs - (Date.now() - lastDone)) / (1000 * 60 * 60));
        return {
          ...m,
          canSubmit,
          nextAvailableInHours
        };
      })
    };
  }

  public computeHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
  }

  public async evaluateAndSubmitProof(
    genAi: GoogleGenAI,
    params: {
      userId: string;
      coupleSpaceId: string;
      missionId: string;
      proofType: 'photo' | 'text';
      proofContent: string;
      reflection?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
    coinsAwarded?: number;
    newBalance?: number;
    evaluation?: any;
  }> {
    const { userId, missionId, proofType, proofContent, reflection = '' } = params;

    const mission = MISSIONS_CATALOG.find(m => m.id === missionId);
    if (!mission) {
      return { success: false, error: 'Invalid mission selected.' };
    }

    const wallet = this.getOrCreateWallet(userId);
    const today = this.getTodayString();

    if (wallet.dailyEarnedToday >= DAILY_MAX_COINS_QUOTA) {
      return {
        success: false,
        error: `Daily reward cap reached (${DAILY_MAX_COINS_QUOTA} coins/day). Come back tomorrow to earn more!`
      };
    }

    const cooldownKey = `${userId}_${missionId}`;
    const lastDone = this.state.recentMissionCompletions[cooldownKey] || 0;
    const cooldownMs = mission.cooldownHours * 60 * 60 * 1000;
    if (Date.now() - lastDone < cooldownMs) {
      const waitHours = Math.ceil((cooldownMs - (Date.now() - lastDone)) / (1000 * 60 * 60));
      return {
        success: false,
        error: `This mission has a cooldown. You can complete it again in ${waitHours} hours.`
      };
    }

    const contentToHash = proofType === 'photo' 
      ? (proofContent.length > 500 ? proofContent.substring(0, 500) + proofContent.length : proofContent)
      : proofContent.toLowerCase().trim();
    const hash = this.computeHash(contentToHash);

    if (this.state.submittedHashes[hash]) {
      return {
        success: false,
        error: 'This photo or reflection was already submitted previously. Please provide a new genuine moment.'
      };
    }

    let evaluation = {
      approved: true,
      reason: 'Verified romantic connection.',
      feedback: 'Great effort putting love into action!',
      sparkScore: 85
    };

    try {
      const prompt = `You are AIRA, the romantic AI companion for couples. Evaluate a proof submitted by a partner for the mission: "${mission.title}".
Mission Description: "${mission.description}"
Proof Type: ${proofType}
Submitted Reflection / Text: "${reflection || '(No reflection text)'}"
${proofType === 'text' ? `Submitted Proof Text: "${proofContent}"` : `Image proof provided: [Image data attached, size: ${proofContent.length} chars]`}

Evaluate objectively:
1. Is this submission genuinely relevant to the requested task?
2. Does it feel sincere and authentic rather than gibberish or spam?
NOTE: Do not be overly harsh or judge personal emotional sincerity; verify task relevance and constructive intent.

Respond strictly in JSON format:
{
  "approved": boolean,
  "reason": "Brief 1-sentence evaluation",
  "feedback": "Warm, encouraging 1-sentence romantic compliment or tip",
  "sparkScore": number (between 50 and 100)
}`;

      let response: any;
      try {
        response = await genAi.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                approved: { type: Type.BOOLEAN },
                reason: { type: Type.STRING },
                feedback: { type: Type.STRING },
                sparkScore: { type: Type.INTEGER }
              },
              required: ['approved', 'reason', 'feedback']
            }
          }
        });
      } catch (err: any) {
        response = await genAi.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        });
      }

      const parsed = JSON.parse(response.text || '{}');
      if (typeof parsed.approved === 'boolean') {
        evaluation = {
          approved: parsed.approved,
          reason: parsed.reason || 'Verified romantic action.',
          feedback: parsed.feedback || 'Wonderful gesture for your relationship!',
          sparkScore: parsed.sparkScore || 85
        };
      }
    } catch (aiErr) {
      console.warn('AIRA AI verification fallback:', aiErr);
      evaluation = {
        approved: true,
        reason: 'Proof accepted for romantic mission.',
        feedback: 'Thank you for sharing this special moment together!',
        sparkScore: 80
      };
    }

    if (!evaluation.approved) {
      return {
        success: false,
        error: evaluation.reason || 'The submitted proof did not match the mission requirements. Please try again with relevant proof.',
        evaluation
      };
    }

    const maxAwardable = Math.max(0, DAILY_MAX_COINS_QUOTA - wallet.dailyEarnedToday);
    const awardCoins = Math.min(mission.coinsReward, maxAwardable);

    if (awardCoins <= 0) {
      return {
        success: false,
        error: 'Daily reward cap reached. No more coins can be awarded today.'
      };
    }

    wallet.balance += awardCoins;
    wallet.totalEarned += awardCoins;
    wallet.dailyEarnedToday += awardCoins;
    wallet.lastEarnDate = today;
    wallet.updatedAt = Date.now();

    const tx: ServerCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amount: awardCoins,
      type: 'mission_reward',
      description: `Completed: ${mission.title}`,
      referenceId: mission.id,
      createdAt: Date.now()
    };
    this.state.transactions.push(tx);
    this.state.submittedHashes[hash] = { userId, timestamp: Date.now(), missionId };
    this.state.recentMissionCompletions[cooldownKey] = Date.now();
    this.saveState();

    return {
      success: true,
      coinsAwarded: awardCoins,
      newBalance: wallet.balance,
      evaluation
    };
  }

  public spendCoins(params: {
    userId: string;
    itemId: string;
    itemType: string;
    cost: number;
  }): { success: boolean; error?: string; newBalance?: number; inventory?: ServerUserInventory } {
    const { userId, itemId, cost } = params;

    if (cost <= 0) {
      return { success: false, error: 'Invalid cost amount.' };
    }

    const wallet = this.getOrCreateWallet(userId);
    const inventory = this.getOrCreateInventory(userId);

    if (wallet.balance < cost) {
      return {
        success: false,
        error: `Insufficient Love Coins. You have ${wallet.balance} coins, but this item costs ${cost}. Complete romantic missions to earn more!`
      };
    }

    const shopItem = SHOP_CATALOG.find(i => i.id === itemId);
    const itemName = shopItem?.name || itemId;

    if (shopItem?.category === 'themes') {
      if (inventory.ownedThemes.includes(itemId)) {
        return { success: false, error: 'You already own this theme! You can equip it anytime in My Collection.' };
      }
      inventory.ownedThemes.push(itemId);
      inventory.activeTheme = itemId;
    } else if (shopItem?.category === 'badges') {
      if (itemId === 'token_streak_freeze') {
        inventory.streakFreezeTokens = (inventory.streakFreezeTokens || 0) + 1;
      } else {
        if (inventory.ownedBadges.includes(itemId)) {
          return { success: false, error: 'You already own this badge! You can equip it anytime.' };
        }
        inventory.ownedBadges.push(itemId);
        inventory.equippedBadge = itemId;
      }
    } else if (shopItem?.category === 'game_packs') {
      if (inventory.ownedGamePacks.includes(itemId)) {
        return { success: false, error: 'You already own this game pack!' };
      }
      inventory.ownedGamePacks.push(itemId);
    }

    wallet.balance -= cost;
    wallet.totalSpent += cost;
    wallet.updatedAt = Date.now();
    inventory.updatedAt = Date.now();

    const tx: ServerCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amount: -cost,
      type: 'item_purchase',
      description: `Unlocked: ${itemName}`,
      referenceId: itemId,
      createdAt: Date.now()
    };
    this.state.transactions.push(tx);
    this.saveState();

    return {
      success: true,
      newBalance: wallet.balance,
      inventory
    };
  }

  public sendVirtualGift(params: {
    userId: string;
    coupleSpaceId: string;
    giftId: string;
    giftName: string;
    cost: number;
    recipientId?: string;
    note?: string;
  }): { success: boolean; error?: string; newBalance?: number; gift?: any } {
    const { userId, coupleSpaceId, giftId, giftName, cost, recipientId, note } = params;

    const wallet = this.getOrCreateWallet(userId);
    if (wallet.balance < cost) {
      return {
        success: false,
        error: `Insufficient Love Coins. This gift costs ${cost} coins, but your balance is ${wallet.balance}.`
      };
    }

    wallet.balance -= cost;
    wallet.totalSpent += cost;
    wallet.updatedAt = Date.now();

    const tx: ServerCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amount: -cost,
      type: 'virtual_gift',
      description: `Sent Gift: ${giftName}`,
      referenceId: giftId,
      createdAt: Date.now()
    };
    this.state.transactions.push(tx);

    const giftRecord = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coupleSpaceId,
      senderId: userId,
      recipientId,
      giftId,
      giftName,
      cost,
      note: note || '',
      createdAt: Date.now()
    };

    this.saveState();

    return {
      success: true,
      newBalance: wallet.balance,
      gift: giftRecord
    };
  }

  public verifyAndClaimReferral(params: {
    userId: string;
    coupleSpaceId: string;
    referralCode: string;
  }): { success: boolean; error?: string; coinsAwarded?: number; newBalance?: number } {
    const { userId, referralCode } = params;

    if (!referralCode || referralCode.trim().length < 4) {
      return { success: false, error: 'Please enter a valid referral code.' };
    }

    const cleanCode = referralCode.trim().toUpperCase();

    if (cleanCode === userId.toUpperCase() || cleanCode.includes(userId.substring(0, 5).toUpperCase())) {
      return { success: false, error: 'You cannot use your own referral code.' };
    }

    if (this.state.claimedReferrals[userId]) {
      return { success: false, error: 'You have already claimed a referral bonus on this account.' };
    }

    const REFERRAL_BONUS = 50;
    const WELCOME_BONUS = 25;

    const refereeWallet = this.getOrCreateWallet(userId);
    refereeWallet.balance += WELCOME_BONUS;
    refereeWallet.totalEarned += WELCOME_BONUS;
    refereeWallet.updatedAt = Date.now();

    this.state.transactions.push({
      id: `tx_${Date.now()}_ref_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      amount: WELCOME_BONUS,
      type: 'referral_bonus',
      description: `Welcome Bonus from referral code: ${cleanCode}`,
      createdAt: Date.now()
    });

    const possibleReferrerId = Object.keys(this.state.wallets).find(id => 
      id.toUpperCase().startsWith(cleanCode) || id.toUpperCase() === cleanCode
    );
    if (possibleReferrerId && possibleReferrerId !== userId) {
      const referrerWallet = this.state.wallets[possibleReferrerId];
      referrerWallet.balance += REFERRAL_BONUS;
      referrerWallet.totalEarned += REFERRAL_BONUS;
      referrerWallet.updatedAt = Date.now();

      this.state.transactions.push({
        id: `tx_${Date.now()}_ref_inv_${Math.random().toString(36).substring(2, 6)}`,
        userId: possibleReferrerId,
        amount: REFERRAL_BONUS,
        type: 'referral_bonus',
        description: `Referral Reward: Friend joined Love Link!`,
        createdAt: Date.now()
      });
    }

    this.state.claimedReferrals[userId] = cleanCode;
    this.saveState();

    return {
      success: true,
      coinsAwarded: WELCOME_BONUS,
      newBalance: refereeWallet.balance
    };
  }

  public claimDailyStreak(userId: string): {
    success: boolean;
    error?: string;
    coinsAwarded?: number;
    streakDays?: number;
    newBalance?: number;
  } {
    const wallet = this.getOrCreateWallet(userId);
    const today = this.getTodayString();

    if (wallet.lastCheckInDate === today) {
      return {
        success: false,
        error: 'You have already checked in today! Return tomorrow to keep your streak glowing.'
      };
    }

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = wallet.streakDays || 0;
    if (wallet.lastCheckInDate === yesterday) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    // Daily reward base + streak bonus
    const baseReward = 20;
    const streakBonus = Math.min((currentStreak - 1) * 5, 40);
    const totalAward = baseReward + streakBonus;

    wallet.balance += totalAward;
    wallet.totalEarned += totalAward;
    wallet.streakDays = currentStreak;
    wallet.lastCheckInDate = today;
    wallet.updatedAt = Date.now();

    const tx: ServerCoinTransaction = {
      id: `tx_${Date.now()}_checkin_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      amount: totalAward,
      type: 'daily_checkin',
      description: `Daily Love Streak: Day ${currentStreak} (+${totalAward} coins)`,
      createdAt: Date.now()
    };
    this.state.transactions.push(tx);
    this.saveState();

    return {
      success: true,
      coinsAwarded: totalAward,
      streakDays: currentStreak,
      newBalance: wallet.balance
    };
  }

  public updateActivePreferences(userId: string, prefs: { activeTheme?: string; equippedBadge?: string }) {
    const inventory = this.getOrCreateInventory(userId);
    if (prefs.activeTheme && inventory.ownedThemes.includes(prefs.activeTheme)) {
      inventory.activeTheme = prefs.activeTheme;
    }
    if (prefs.equippedBadge !== undefined) {
      if (prefs.equippedBadge === '' || inventory.ownedBadges.includes(prefs.equippedBadge)) {
        inventory.equippedBadge = prefs.equippedBadge;
      }
    }
    inventory.updatedAt = Date.now();
    this.saveState();
    return inventory;
  }
}

const coinsEconomy = new CoinsEconomyManager();

// GET /api/coins/wallet - Authoritative wallet, quota, inventory, and missions status
app.get('/api/coins/wallet', (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }
    const summary = coinsEconomy.getWalletSummary(userId);
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    console.error('Error fetching wallet:', err);
    return res.status(500).json({ error: 'Failed to retrieve wallet information' });
  }
});

// GET /api/coins/catalogs - Get shop items & missions catalogs
app.get('/api/coins/catalogs', (req, res) => {
  return res.json({
    success: true,
    shop: SHOP_CATALOG,
    missions: MISSIONS_CATALOG
  });
});

// POST /api/coins/submit-proof - Objective AIRA AI proof analysis and reward issuance
app.post('/api/coins/submit-proof', async (req, res) => {
  try {
    const { userId, coupleSpaceId, missionId, proofType, proofContent, reflection } = req.body;
    if (!userId || !missionId || !proofType || !proofContent) {
      return res.status(400).json({ error: 'Missing required parameters: userId, missionId, proofType, proofContent' });
    }

    const result = await coinsEconomy.evaluateAndSubmitProof(ai, {
      userId,
      coupleSpaceId: coupleSpaceId || '',
      missionId,
      proofType,
      proofContent,
      reflection
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error, evaluation: result.evaluation });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error evaluating mission proof:', err);
    return res.status(500).json({ success: false, error: 'Internal error analyzing mission proof. Please try again.' });
  }
});

// POST /api/coins/spend - Atomic coin spending and inventory unlocks
app.post('/api/coins/spend', (req, res) => {
  try {
    const { userId, itemId, itemType, cost } = req.body;
    if (!userId || !itemId || typeof cost !== 'number') {
      return res.status(400).json({ error: 'Missing required parameters: userId, itemId, cost' });
    }

    const result = coinsEconomy.spendCoins({
      userId,
      itemId,
      itemType: itemType || 'item',
      cost
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error in spending coins:', err);
    return res.status(500).json({ success: false, error: 'Internal transaction error.' });
  }
});

// POST /api/coins/send-gift - Send virtual romantic gift to partner with animation triggers
app.post('/api/coins/send-gift', (req, res) => {
  try {
    const { userId, coupleSpaceId, giftId, giftName, cost, recipientId, note } = req.body;
    if (!userId || !giftId || !giftName || typeof cost !== 'number') {
      return res.status(400).json({ error: 'Missing required parameters: userId, giftId, giftName, cost' });
    }

    const result = coinsEconomy.sendVirtualGift({
      userId,
      coupleSpaceId: coupleSpaceId || '',
      giftId,
      giftName,
      cost,
      recipientId,
      note
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error sending virtual gift:', err);
    return res.status(500).json({ success: false, error: 'Failed to send virtual gift.' });
  }
});

// POST /api/coins/verify-referral - Claim referral bonus with anti-cheat validation
app.post('/api/coins/verify-referral', (req, res) => {
  try {
    const { userId, coupleSpaceId, referralCode } = req.body;
    if (!userId || !referralCode) {
      return res.status(400).json({ error: 'userId and referralCode are required' });
    }

    const result = coinsEconomy.verifyAndClaimReferral({
      userId,
      coupleSpaceId: coupleSpaceId || '',
      referralCode
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error verifying referral:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify referral code.' });
  }
});

// POST /api/coins/update-preferences - Update active theme or equipped badge
app.post('/api/coins/update-preferences', (req, res) => {
  try {
    const { userId, activeTheme, equippedBadge } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const inventory = coinsEconomy.updateActivePreferences(userId, { activeTheme, equippedBadge });
    return res.json({ success: true, inventory });
  } catch (err: any) {
    console.error('Error updating coin preferences:', err);
    return res.status(500).json({ success: false, error: 'Failed to update preferences.' });
  }
});

// POST /api/coins/check-in - Daily love streak check-in with streak multiplier
app.post('/api/coins/check-in', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = coinsEconomy.claimDailyStreak(userId);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error claiming daily streak check-in:', err);
    return res.status(500).json({ success: false, error: 'Failed to claim daily check-in.' });
  }
});

// Health check endpoint for Cloud Run and container orchestration
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Helper to determine the canonical origin for SEO and sitemaps
function getCanonicalOrigin(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VITE_APP_URL) {
    return process.env.VITE_APP_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'love-link.app';
  return `${proto}://${host}`;
}

// In-memory store for custom Google Search Console verification token if configured via UI
let dynamicGscToken = process.env.GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION || 'f9e701bd5d974c1f';

// 1. Dynamic robots.txt route for Search Console & web crawlers
app.get('/robots.txt', (req, res) => {
  const origin = getCanonicalOrigin(req);
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Allow: /market',
    'Allow: /features',
    'Allow: /about',
    'Allow: /privacy',
    'Allow: /terms',
    'Allow: /favicon.ico',
    'Allow: /icon.svg',
    'Allow: /pwa-*.png',
    'Allow: /apple-touch-icon.png',
    'Allow: /google*.html',
    '',
    '# Shield private couple spaces, individual chat messages, memories, and internal API routes',
    'Disallow: /space/',
    'Disallow: /chat/',
    'Disallow: /timeline/',
    'Disallow: /settings/',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(robotsTxt);
});

// 2. Dynamic sitemap.xml route for Search Console indexer
app.get('/sitemap.xml', (req, res) => {
  const origin = getCanonicalOrigin(req);
  const today = new Date().toISOString().split('T')[0];

  const publicRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/market', priority: '0.9', changefreq: 'daily' },
    { path: '/features', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'weekly' },
    { path: '/privacy', priority: '0.5', changefreq: 'monthly' },
    { path: '/terms', priority: '0.5', changefreq: 'monthly' },
  ];

  const urlEntries = publicRoutes.map(route => `  <url>
    <loc>${origin}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=43200');
  res.send(xml);
});

// 3. Google Search Console HTML verification file routes
const EXACT_GSC_TOKEN = 'f9e701bd5d974c1f';
const EXACT_GSC_FILENAME = `google${EXACT_GSC_TOKEN}.html`;

// Serve ONLY the legitimate Google verification file with exact token
app.get(`/${EXACT_GSC_FILENAME}`, (req, res) => {
  const distFile = path.resolve(__dirname, 'dist', EXACT_GSC_FILENAME);
  const publicFile = path.resolve(__dirname, 'public', EXACT_GSC_FILENAME);
  const targetFile = fs.existsSync(distFile) ? distFile : fs.existsSync(publicFile) ? publicFile : null;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (targetFile) {
    return res.sendFile(targetFile);
  }
  return res.send(`google-site-verification: ${EXACT_GSC_FILENAME}\n`);
});

// Support configurable token via env var if provided and different
const envGscToken = process.env.GOOGLE_SITE_VERIFICATION || process.env.VITE_GOOGLE_SITE_VERIFICATION;
if (envGscToken && envGscToken !== EXACT_GSC_TOKEN) {
  const envFilename = `google${envGscToken}.html`;
  app.get(`/${envFilename}`, (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`google-site-verification: ${envFilename}\n`);
  });
}

// CRITICAL FOR GOOGLE SEARCH CONSOLE ANTI-SPOOF / ANTI-HACKING VALIDATION:
// Any other /google* request (probes, non-existent tokens, soft-404 tests) MUST return 404 Not Found!
// Never return 200 OK or the application homepage for non-existent verification probes.
app.all(/^\/google.*$/i, (req, res) => {
  res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send('404 Not Found');
});

// 4. API endpoint to inspect or update Google Search Console verification settings
app.get('/api/seo/status', (req, res) => {
  const origin = getCanonicalOrigin(req);
  res.json({
    origin,
    googleSiteVerification: dynamicGscToken || 'Not set',
    sitemapUrl: `${origin}/sitemap.xml`,
    robotsUrl: `${origin}/robots.txt`,
    verificationFileRouteExample: `${origin}/google1234567890abcdef.html`,
    isOptimizedForGsc: true,
  });
});

app.post('/api/seo/token', (req, res) => {
  const { token } = req.body;
  if (typeof token === 'string') {
    dynamicGscToken = token.trim();
    return res.json({ success: true, token: dynamicGscToken });
  }
  return res.status(400).json({ success: false, error: 'Invalid token' });
});

// DPDP Consent Logging Audit Endpoint
app.post('/api/dpdp/consent-log', (req, res) => {
  try {
    const record = req.body;
    console.log(`[DPDP Audit] Consent recorded: ID=${record.consentId}, User=${record.userId}, Notice=${record.noticeVersion}`);
    res.json({ success: true, loggedAt: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DPDP Data Rights Request Intake Endpoint
app.post('/api/dpdp/rights-request', (req, res) => {
  try {
    const request = req.body;
    console.log(`[DPDP Grievance Intake] New Statutory Request: Ticket=${request.ticketNumber}, Type=${request.requestType}, Email=${request.userEmail}`);
    res.json({ 
      success: true, 
      ticketNumber: request.ticketNumber, 
      statutoryDeadlineDays: 30,
      grievanceOfficerEmail: 'grievance-dpdp@love-link.app' 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DPDP Status & Governance Info Endpoint
app.get('/api/dpdp/status', (req, res) => {
  res.json({
    complianceStandard: 'Digital Personal Data Protection Act, 2023 (India)',
    noticeVersion: 'dpdp-2023-v1.0',
    dataFiduciary: 'Love Link Digital Sanctuary (India) Private Limited',
    grievanceOfficer: {
      name: 'Priyadarshini Rao',
      designation: 'Data Protection & Grievance Redressal Officer',
      email: 'grievance-dpdp@love-link.app',
      slaResponseHours: 48,
      slaResolutionDays: 30,
    },
    rightsSupported: ['Access', 'Correction', 'Erasure', 'WithdrawConsent', 'Nomination'],
    statutoryBoard: 'Data Protection Board of India (DPBI)',
  });
});


async function startServer() {
  const isDev = process.env.NODE_ENV === 'development';
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  if (!isDev && hasDist) {
    // Production / Deployed environment: serve pre-built static bundle
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const ext = path.extname(req.path).toLowerCase();
      // If a file extension is present (.html, .xml, .txt, .php, etc.) and not in static assets, return 404 to prevent soft 404
      if (ext && ext !== '.html') {
        return res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send('404 Not Found');
      }
      if (ext === '.html' && req.path !== '/' && req.path !== '/index.html') {
        return res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8').send('404 Not Found');
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`Serving static assets from ${distPath}`);
  } else {
    // Development environment: attach Vite dev server middleware with HMR disabled
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running in Vite development mode (HMR disabled)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
