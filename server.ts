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
