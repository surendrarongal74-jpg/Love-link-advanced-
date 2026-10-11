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
