const {sendMessage, editMessage, deleteMessage} = require('./message') 
const {handleUserInputs} = require('./userinteraction')
const {getSession, setSession, deleteSession, certificatesCache} = require('./cache')
const {sendCertificatesMenu} = require('./databasefns')

const handleMessage = async (message) => {
    // Handle text messages
    if (message.text === '/start'){
        const reply_markup = {
            inline_keyboard: [
                [{text:'e-Sevai Certificates', callback_data:'tn_services'}],
                [{text:'Apply for Voter Id', callback_data:'voter_id'}],
                [{text:'Aadhar Services', callback_data:'aadhar_services'}], 
                [{text:'Help', callback_data:'help'}],
                [{text:'Join the Channel', url:'https://t.me/tnesevairobotnews'}]
            ]
        }
        function escapeMarkdownV2(text) {
            return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
        }
        const fname=escapeMarkdownV2(message.chat.first_name)
        const welMessage = 
`*Hi ${fname} 😊*
\>*Welcome to IMMO e\\-Services\\, choose an option from the list below\\.*`;
        console.log(welMessage)
        await sendMessage(message.chat.id, welMessage, reply_markup,'MarkdownV2' );
    }
    else if(!message.text.startsWith('/')){
        await handleUserInputs(message.chat.id, message);
    }
    else if (message.text === '/help'){
        const reply_markup = {
            inline_keyboard: [
                [{text:'English', callback_data:'help_english'}, {text:'Tanglish', callback_data:'help_tanglish'}]
            ]
        }
        sendMessage(message.chat.id, "Select the language comfortable for you😊", reply_markup )
    }

    else if (message.text === '/certificate'){
        await sendCertificatesMenu(message.chat.id, 'tn_certificates'); 
    }
    else if (message.text === '/voterid'){
        await sendCertificatesMenu(message.chat.id, 'voter_id'); 
    }
    else if (message.text === '/aadhar'){
        await sendCertificatesMenu(message.chat.id, 'aadhar_services'); 
    }
}

module.exports = {handleMessage}