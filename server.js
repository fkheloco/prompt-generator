const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to generate prompts
app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { concept, style, context } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    // Create a system prompt that instructs the AI to generate well-formatted prompts
    const systemPrompt = `You are an expert prompt engineer. Your task is to convert plain language concepts into amazingly formatted AI prompts.

Guidelines for creating effective prompts:
1. Be specific and detailed
2. Include clear instructions and constraints
3. Use structured formatting with sections
4. Include examples when helpful
5. Specify the desired output format
6. Add context and background information
7. Include role-playing elements when appropriate
8. Use clear, professional language

The user will provide a concept, and you should create a comprehensive, well-structured prompt that would work excellently with AI models like GPT-4.`;

    // Create the user message
    let userMessage = `Please create an amazingly formatted AI prompt for this concept: "${concept}"`;
    
    if (style) {
      userMessage += `\n\nStyle preference: ${style}`;
    }
    
    if (context) {
      userMessage += `\n\nAdditional context: ${context}`;
    }

    userMessage += `\n\nPlease format the prompt with clear sections, detailed instructions, and make it comprehensive enough to get excellent results from an AI model.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedPrompt = completion.choices[0].message.content;

    res.json({
      success: true,
      originalConcept: concept,
      generatedPrompt: generatedPrompt,
      style: style || 'default',
      context: context || null
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to generate prompt',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Prompt Generator API is running' });
});

app.listen(port, () => {
  console.log(`🚀 Prompt Generator server running on http://localhost:${port}`);
  console.log(`📝 API endpoint: http://localhost:${port}/api/generate-prompt`);
});
