const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Telegram bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Function to fetch NASA APOD
async function getNasaAPOD() {
    try {
        console.log('Fetching NASA APOD...');
        const response = await axios.get('https://api.nasa.gov/planetary/apod', {
            params: {
                api_key: process.env.NASA_API_KEY
            }
        });
        console.log('NASA APOD data received:', response.data.title);
        return response.data;
    } catch (error) {
        console.error('Error fetching NASA APOD:', error.response?.data || error.message);
        return null;
    }
}

// Function to post to Telegram
async function postToTelegram(message, imageUrl) {
    try {
        console.log('Attempting to send to Telegram...');
        await bot.sendPhoto(process.env.TELEGRAM_CHANNEL_ID, imageUrl, {
            caption: message,
            parse_mode: 'Markdown'
        });
        console.log('Posted successfully to Telegram!');
    } catch (error) {
        console.error('Detailed Telegram Error:', {
            message: error.message,
            code: error.code,
            response: error.response,
            description: error.description
        });
    }
}

// Function to post NASA APOD
async function postNasaAPOD() {
    const apodData = await getNasaAPOD();
    if (!apodData) {
        console.error('No APOD data received');
        return;
    }

    const message = `
🌟 *NASA Astronomy Picture of the Day*

*${apodData.title}*
📅 Date: ${apodData.date}

${apodData.explanation}

🔭 Image Credit: NASA
`;

    await postToTelegram(message, apodData.hdurl || apodData.url);
    
}

// Endpoint to manually trigger a post
app.get('/trigger-post', async (req, res) => {
    console.log('Manual trigger received');
    try {
        await postNasaAPOD();
        res.json({ message: 'Post triggered successfully' });
    } catch (error) {
        console.error('Error in trigger endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        botToken: process.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing',
        channelId: process.env.TELEGRAM_CHANNEL_ID,
        nasaKey: process.env.NASA_API_KEY ? 'Present' : 'Missing'
    });
});
 
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Bot configured for channel:', process.env.TELEGRAM_CHANNEL_ID);
});