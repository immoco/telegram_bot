const axios = require('axios');
require('dotenv').config()

const {TOKEN} = process.env

const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;


const sendMessage = async (...args) => {
    const reqData = {
        chat_id: args[0],
        text: args[1],
        ...(args[2] !== '' ? { reply_markup: args[2] } : ''),
        ...(args[3] ? { parse_mode: args[3] } : {}),
    };

    try {
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, reqData);
        console.log('Message sent:', response.data);
        return response.data.result; // Return the sent message details, including message_id
    } catch (error) {
        console.log('Error:', error);
        throw error; // d
    }
};

const editMessage = async (...args) => {

    const reqData = {
        chat_id: args[0],
        text: args[1],
        message_id: args[2],
        ...(args[3] ? {reply_markup: args[3]}:{}),
        ...(args[4] ? {parse_mode: args[4]}:{}),

    };

    await axios.post(`${TELEGRAM_API}/editMessageText`, reqData).then(res=>{
        console.log('Message sent:', res.data );
    }).catch(err=>{
        console.log('Error:', err);
    })
}

const deleteMessage = async (chatId, messageId) => {
    try {
        await axios.post(`${TELEGRAM_API}/deleteMessage`, {
            chat_id: chatId,
            message_id: messageId
        });
        console.log(`Message ${messageId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting message:", error.response ? error.response.data : error.message);
    }
 };

module.exports = {
    sendMessage,
    editMessage,
    deleteMessage
}