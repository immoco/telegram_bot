require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const cors = require('cors');

const NodeCache = require("node-cache");
const certificatesCache = new NodeCache({ stdTTL: 300 });

const {getTimeKeyboard, getDateKeyboard} = require('./calendar');
const {sendMessage, editMessage, deleteMessage} = require('./message');
const {handleCallbackQuery} = require('./handleCallback');
const {handleMessage} = require('./handleMessage');



const {TOKEN, URL} = process.env

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const WEBHOOK = `/webhook/${TOKEN}`;
const WEBHOOK_URL = `${URL}/webhook/${TOKEN}`;

const app = express();
app.use(bodyParser.json());
app.use(cors());



const init = async ()=> {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

app.post(WEBHOOK, async (req, res) => {
    const data = req.body;
    console.log(data);
    const { message, callback_query } = req.body;
    try {
        if (callback_query) {
            // Handle callback query
            const { data: callbackData, message: callbackMessage } = callback_query;
            const chatId = callbackMessage.chat.id;
            const messageId = callbackMessage.message_id;
            await handleCallbackQuery(callback_query, callbackData, chatId, messageId);
        } else if (message && message.text) {
            await handleMessage(message);
        }
    } catch (error) {
        console.error("Error handling webhook update:", error);
    }

    return res.send();
})

app.listen(process.env.PORT || 3001, async () => {
    console.log('Server is running:', process.env.PORT || 3001);
    init();
})






  
