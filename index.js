// Import required modules
require('dotenv').config();
const fs = require('fs');
const TelegramBot = require('telegram-bot-api');
const { OpenAI } = require('openai');

// Load the configuration data from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Get API keys from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize the Telegram bot
const api = new TelegramBot({
  token: TELEGRAM_BOT_TOKEN,
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Function to handle incoming messages
api.on('message', async (message) => {
  const chatId = message.chat.id;
  const userMessage = message.text;

  // Respond with personality-related info or OpenAI's response
  if (userMessage.toLowerCase() === 'who are you?') {
    // Return bot personality details
    const botReply = `
      Hello! I'm ${config.name}, an 18-year-old introverted and laid-back person living in Aspen, Colorado.
      I love gaming, reading, and drawing. My favorite food is ${config.personality.favorite_food}, and my ideal place to relax is ${config.personality.ideal_place_to_relax}.
      Here's a quote I live by: "${config.personality.quote}"
    `;
    api.sendMessage({
      chat_id: chatId,
      text: botReply,
    });
  } else if (userMessage.toLowerCase() === 'what is your favorite color?') {
    // Respond with favorite color
    api.sendMessage({
      chat_id: chatId,
      text: `My favorite color is ${config.personality.favorite_color}.`,
    });
  } else {
    // Handle OpenAI responses for other messages
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: userMessage }],
        model: 'gpt-4o-mini', // You can use GPT-4 if needed
      });

      const botReply = completion.choices[0].message.content;

      // Send the OpenAI response to the user
      api.sendMessage({
        chat_id: chatId,
        text: botReply,
      });
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      api.sendMessage({
        chat_id: chatId,
        text: 'Sorry, there was an error processing your request.',
      });
    }
  }
});

// Start the Telegram bot
api.start();
console.log('Telegram bot is running...');