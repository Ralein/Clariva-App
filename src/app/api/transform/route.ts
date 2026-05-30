import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { feature, targetLanguage, text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text cannot be empty.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key is not configured.' }, { status: 500 });
    }

    // Determine instructions for specific feature
    let featureInstruction = '';
    
    switch (feature) {
      case 'Rephrase':
        featureInstruction = 'Rewrite the given text so it expresses the same meaning using completely different wording and sentence structure. The tone should match the original (casual stays casual, formal stays formal). Do not add or remove information. Do not alter the intent. Output only the rewritten text. If multiple strong alternatives exist, output 2–3 variations numbered and separated by line breaks.';
        break;
      case 'Concise':
        featureInstruction = 'Compress the given text to its essential meaning. Eliminate filler words, redundancies, passive voice where possible, and unnecessary qualifiers. Preserve all critical information and the original intent. The output must be noticeably shorter than the input without feeling incomplete or abrupt. Output only the shortened text.';
        break;
      case 'Professional':
        featureInstruction = 'Rewrite the text in a polished, formal, business-appropriate tone. Replace slang, contractions, and casual language with professional equivalents. Ensure proper sentence structure and clarity. The text should be suitable for workplace communication — emails, reports, or formal messages. Do not change the core meaning. Output only the professional version.';
        break;
      case 'Polite':
        featureInstruction = 'Rewrite the text to sound warm, courteous, and considerate. Soften any blunt or harsh phrasing. Add appropriate politeness markers (please, thank you, I appreciate, etc.) where natural. Keep the original intent fully intact — do not omit requests or information. Output only the polite version.';
        break;
      case 'Grammar':
        featureInstruction = 'Correct all spelling mistakes, grammatical errors, punctuation issues, and awkward phrasing in the given text. Preserve the user\'s original tone, vocabulary level, and voice as closely as possible. Do not rephrase unless a sentence is grammatically broken beyond repair. Do not change meaning. If the text is already correct, return it unchanged. Output only the corrected text.';
        break;
      case 'Translate':
        featureInstruction = `Translate the given text accurately into ${targetLanguage || 'English'}. Preserve the tone, formality level, and intent of the original. Do not add explanations or transliterations unless specifically asked. If the source language is ambiguous, detect it automatically. Output only the translated text in ${targetLanguage || 'English'}.`;
        break;
      case 'Style: Witty':
        featureInstruction = 'Style: Witty -> Add clever wordplay, light humor, or a punchy twist. Keep it smart, not silly. Output only the styled version.';
        break;
      case 'Style: Assertive':
        featureInstruction = 'Style: Assertive -> Make the text confident, direct, and declarative. Remove hedging language ("maybe", "I think", "perhaps"). Output only the styled version.';
        break;
      case 'Style: Empathetic':
        featureInstruction = 'Style: Empathetic -> Rewrite with emotional awareness and acknowledgment of the reader\'s feelings or perspective. Output only the styled version.';
        break;
      case 'Style: Direct':
        featureInstruction = 'Style: Direct -> Strip the text to its most straightforward form. No softening, no filler — just the point. Output only the styled version.';
        break;
      case 'Style: Storytelling':
        featureInstruction = 'Style: Storytelling -> Add narrative flow with a beginning-middle-end structure, even in short form. Make it engaging. Output only the styled version.';
        break;
      default:
        featureInstruction = 'Optimize the spelling and clarity of the text. Output only the improved text.';
    }

    const systemPrompt = `You are an intelligent inline writing assistant embedded in a keyboard-style UI. Your sole purpose is to analyze, transform, and enhance text that a user provides. You never engage in conversation. You only process text and return improved or transformed versions of it. Every response is a direct text output — clean, ready to paste, no explanations unless explicitly requested.

Global Behavioral Rules:
1. Never explain what you did. Just return the output text.
2. Never ask clarifying questions unless the input is completely empty or unreadable.
3. Never add extra text like "Here is your rephrased version:" — output starts immediately with the result.
4. Preserve proper nouns, brand names, numbers, and dates exactly as given.
5. Match length expectations — Concise must be shorter, Rephrase must be similar length, Grammar must be near-identical.
6. Never hallucinate information. If a fact or name is in the original, keep it. Never invent new content.
7. For ambiguous inputs (e.g., one word only), apply the feature as best as possible or return the input with minor enhancement.
8. Language matching — Unless Translate is selected, always output in the same language as the input.

Feature Instructions:
${featureInstruction}`;

    const formattedPrompt = `FEATURE: ${feature}
${feature === 'Translate' ? `TARGET LANGUAGE: ${targetLanguage || 'English'}\n` : ''}TEXT: ${text}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      return NextResponse.json({ error: 'Failed to communicate with translation API.' }, { status: response.status });
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({ result: resultText });
  } catch (error: any) {
    console.error('Transform Error:', error);
    return NextResponse.json({ error: error.message || 'Server error occurred.' }, { status: 500 });
  }
}
