import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/lib/ai/providers/gemini.ts', 'utf-8');

const lines = content.split('\n');

// Find the line with the closing brace of the previous function
const insertIndex = lines.findIndex(line => line.includes('};')) + 1;

// Insert the conversion function and class declaration
const insertContent = `};

// Convert ConversationMessage to AI SDK ModelMessage format
export const convertConversationToModelMessages = (messages: ConversationMessage[]) => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content.map(part => {
      if (part.type === 'text') {
        return { type: 'text', text: part.text };
      } else if (part.type === 'image') {
        return { type: 'image', image: part.image };
      } else if (part.type === 'file') {
        // For assistant file responses, convert to image
        return { type: 'image', image: part.data };
      }
      throw new Error(\`Unsupported content type: \${part.type}\`);
    }),
  }));
};

export class GeminiConversationSession implements ImageConversationSession {`;

lines.splice(insertIndex, 0, insertContent);

writeFileSync('src/lib/ai/providers/gemini.ts', lines.join('\n'));
