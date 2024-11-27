const axios = require('axios');
require('dotenv').config()
const {certificatesCache, servicesCache} = require('./cache');


const {TOKEN} = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

const {sendCertificatesMenu, sendReqDocsandFee}  = require('./databasefns')
const {sendMessage, editMessage, deleteMessage} = require('./message'); 
const {handleCancel, handleProceed, showConfirmation, submitDetails,sendTNservicesMenu} = require('./userinteraction')
const {showDate_Time} = require('./calendar')
const {showHelp}= require('./help')


async function handleCallbackQuery(callback_query, callBackData, chat_id, messageId) {
    if (callBackData === 'tn_certificates'){
      await sendCertificatesMenu(chat_id, callBackData); 
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData === 'tn_services'){
      await sendTNservicesMenu(chat_id, callBackData); 
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData === 'voter_id'){
      await sendCertificatesMenu(chat_id, callBackData); 
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData === 'aadhar_services'){
      await sendCertificatesMenu(chat_id, callBackData); 
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData.toString().startsWith('certificate_')){
      const certificates = certificatesCache.get('certificates');
      console.log(certificates)
      for (const certificate of certificates) {
        if (callBackData === `certificate_${certificate.id}`) {
            await sendReqDocsandFee(chat_id, certificate);
        }
      }
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData.toString().startsWith('service_')){
      let services;
      if (servicesCache.get('voterid_services')) {
        services = servicesCache.get('voterid_services');
      }
      else services = servicesCache.get('aadhar_services');
      console.log(services)
      for (const service of services) {
        if (callBackData === `service_${service.id}`) {
            await sendReqDocsandFee(chat_id, service);
        }
      }
      await deleteMessage(chat_id, messageId);
    }
    else if (callBackData.toString() === 'handle_cancel'){
      await handleCancel(chat_id, callback_query);
    }
    else if (callBackData.toString() === 'handle_proceed'){
        await handleProceed(chat_id, callback_query);
    }
    else if (callBackData.toString() === 'urgent_yes'){
      await showConfirmation(chat_id, true, messageId);
    }
    else if (callBackData.toString() === 'urgent_no' || callBackData.startsWith('date_') || callBackData.startsWith('month_') || callBackData.startsWith('time_') ){
      await showDate_Time(chat_id, callBackData, messageId);
    }
    else if (callBackData.toString() === 'submit_yes' || callBackData.toString() === 'submit_no') {
      await submitDetails(chat_id, messageId);
    }
    else if (callBackData.startsWith('help_')) {
      showHelp(chat_id, callBackData);
    }
    else if (callBackData.toString() === 'help') {
      const reply_markup = {
        inline_keyboard: [
            [{text:'English', callback_data:'help_english'}, {text:'Tanglish', callback_data:'help_tanglish'}]
        ]
    }
    sendMessage(chat_id, "Select the language comfortable for you😊", reply_markup )
    }
    else if(callBackData.toString() === 'open_channel'){
      
    }

answerCallbackQuery(callback_query.id)
}

async function answerCallbackQuery(callbackQueryId) {
    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId
    });
}


module.exports = {
    handleCallbackQuery
}