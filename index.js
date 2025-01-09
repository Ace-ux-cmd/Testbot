require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require('openai');
const fs = require('fs');
const startServer = require('./express');

// Initialize the bot with your Telegram token
const token = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File to store conversation history
const historyFile = './conversation_history.json';

// Function to read the conversation history from the JSON file
const readConversationHistory = (chatId) => {
  try {
    if (fs.existsSync(historyFile)) {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      return history[chatId] || []; // Return the chat history for the given chatId or an empty array
    }
    return []; // If no history file exists, return an empty array
  } catch (error) {
    console.error('Error reading conversation history:', error);
    return [];
  }
};

// Function to update the conversation history
const updateConversationHistory = (chatId, userMessage, botResponse) => {
  let history = {};
  try {
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    // If chatId doesn't exist in history, initialize it
    if (!history[chatId]) {
      history[chatId] = [];
    }

    // Add the new conversation to the history
    history[chatId].push({ user: userMessage, bot: botResponse });

    // Save the updated history back to the file
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing conversation history:', error);
  }
};

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  const firstName = msg.from.first_name;
  const greeting = `Hello ${firstName} 👋🏼, I'm your friendly AI bot. How can I assist you today?`;

  // Create inline keyboard with 2 buttons with links
  const inlineKeyboard = [
    [
      {
        text: 'Send Feedback On telegram', // Button text
        url: 't.me/aceuchiha100' // URL to open
      },
      {
        text: 'Add on Facebook', // Button text
        url: 'https://www.facebook.com/profile.php?id=61563840244912' // URL to open
      }
    ]
  ];

  const options = {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  };

  // Send greeting message with inline keyboard
  bot.sendMessage(chatId, greeting, options);
});

// Handle user messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.is_bot || !msg.text || msg.text.startsWith('/')) return;

  if (msg.chat.type !== 'private') return;

  const userMessage = msg.text;

  try {
    // Load conversation history for the current user
    const conversationHistory = readConversationHistory(chatId);

    // Construct the message history for OpenAI
    const messages = [
      { role: 'system', content: 'You are a friendly assistant.' },
      ...conversationHistory.map(entry => ({
        role: 'user',
        content: entry.user
      })),
      { role: 'user', content: userMessage }
    ];

    // Get a response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
    });

    const aiResponse = response.choices[0].message.content;

    // Send the response back to the user
    bot.sendMessage(chatId, aiResponse);

    // Update the conversation history with the latest exchange
    updateConversationHistory(chatId, userMessage, aiResponse);

  } catch (error) {
    console.error('OpenAI API error:', error);
    bot.sendMessage(chatId, "Sorry, there was an issue processing your request.");
  }
});

startServer();

console.log('Bot is running...');