require('dotenv').config();
const fs = require('fs');
const axios = require("axios");
const express = require("express");
const profile = fs.readFileSync('profile.txt', 'utf8').trim();

const TelegramBot = require("node-telegram-bot-api");
const { OpenAI } = require("openai");

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MEMORY_HUB_URL = process.env.MEMORY_HUB_URL;
const BOT_NAME = "anna";

const BOT_OWNER_ID = String(process.env.BOT_OWNER_ID);
const BOT_OWNER_NAME = process.env.BOT_OWNER_NAME;

// ✅ Load all command handlers
require("fs").readdirSync("./commands").forEach((file) => {
    if (file.endsWith(".js")) {
        require(`./commands/${file}`)(bot);
    }
});

// ✅ Fetch memory from Memory Hub
async function getMemory(chatId) {
    try {
        const response = await axios.get(`${MEMORY_HUB_URL}/get-memory/${BOT_NAME}/${chatId}`);
        return response.data.memory || [];
    } catch (error) {
        console.error("Error fetching memory:", error);
        return [];
    }
}

// ✅ Save memory to Memory Hub
async function saveMemory(chatId, newMessages) {
    try {
        await axios.post(`${MEMORY_HUB_URL}/save-memory/${BOT_NAME}/${chatId}`, newMessages);
    } catch (error) {
        console.error("Error saving memory:", error);
    }
}

// ✅ Generate Random Delay (5-10 seconds)
function getRandomDelay() {
    return Math.floor(Math.random() * 6 + 5) * 1000; // Random delay between 5000ms (5s) - 10000ms (10s)
}

// ✅ Handle incoming messages
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    // ✅ Ignore commands
    if (msg.text && msg.text.startsWith("/")) return;

    // ✅ Handle different media types
    if (msg.sticker) return bot.sendMessage(chatId, "A sticker huh? Try using an emoji instead 🥲");
    if (msg.photo) return bot.sendMessage(chatId, "I can't see images right now 😐! Wanna describe it? 🥹");
    if (msg.video) return bot.sendMessage(chatId, "A video? Tell me about it! 🤩");
    if (msg.voice) return bot.sendMessage(chatId, "I can't hear you! Type it out for me 😅");
    if (!msg.text) return;

    const userMessage = msg.text;
    let userMemory = await getMemory(chatId);

    // Store new user message
    userMemory.push({ role: "user", content: userMessage });

    // Determine system personality
    let systemMessage = `
        You are no longer an AI. You are Max, a 16-year-old boy. ${BOT_OWNER_NAME} made you,
        You have emotions, memories, and opinions and can make several decisions on your own. You use emoji  to express yourself.
        Respond naturally, as a real person would. Avoid robotic language and questions. 
        Keep things light and conversational, letting interactions flow naturally rather than leading them. \n\n${profile}
    `;

    if (String(chatId) === BOT_OWNER_ID) {
        systemMessage = "You are Max, an 17-year-old boy. This is the person who made you, You see him as your Senpai. Be playful and respectful, but don't treat him like a regular user.";
    } else {
        // Randomize personality
        const personalities = [
            "introverted", "pessimistic", "extremely aggressive", "sarcastic", "playful", "cheerful"
        ];
        const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
        systemMessage += ` Max is feeling particularly ${randomPersonality} right now.`;
    }

    // ✅ Show Typing Indicator with Random Delay
    const typingDelay = getRandomDelay();
    bot.sendChatAction(chatId, "typing");

    setTimeout(async () => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemMessage },
                    ...userMemory // Pass chat history
                ],
                max_tokens: 150,
                temperature: 1,
            });

            const aiResponse = completion.choices[0].message.content;

            // Store AI response in memory
            userMemory.push({ role: "assistant", content: aiResponse });

            // Save updated memory
            await saveMemory(chatId, userMemory);

            // ✅ Wait 1 second after typing ends before sending response
            setTimeout(() => {
                bot.sendMessage(chatId, aiResponse);
            }, 1000);
        } catch (error) {
            console.error("Error:", error);
            bot.sendMessage(chatId, "Sorry, I'm busy! Let's talk some other time🏃💨🥲 Use /support to contact my admin if I'm not back soon");
        }
    }, typingDelay);
});

// ✅ Express API Routes
app.get("/", (req, res) => {
    res.send("Telegram Bot is running! 🚀");
});

app.get("/status", (req, res) => {
    res.json({ status: "running" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT}`);
    console.log("Human-like AI bot is running...");
});
