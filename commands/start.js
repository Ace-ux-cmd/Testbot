module.exports = (bot) => {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const userName = msg.chat.first_name || "friend";

        const welcomeMessage = `Hey there🤗! I'm Anna, an AI who’s definitely a lot cooler than your last AI. 😌  Use /support to join my support group chat for updates `;

        // Send welcome message
        bot.sendMessage(chatId, welcomeMessage)
    });
};￼Enter
