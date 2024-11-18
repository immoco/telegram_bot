const axios = require('axios');
const {sendMessage, editMessage, deleteMessage} = require('./message');
const {getSession, setSession, deleteSession, certificatesCache, servicesCache} = require('./cache');
const {fetchAgentData, sendToServer} = require('./databasefns');
const {validateEmail, validateMobile} = require('./input_validation')

const random_hash = ()=>{
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  var hash=''
  for (var i=0;i<2;i++) {
    hash+=chars.charAt(Math.floor(Math.random()*chars.length))
  }
  return hash
}

const formatCurrentDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return { day, month, year };
};

const UniqueId = async (certificateName, mobileNumber) => {
  const certificatePrefix = certificateName.substring(0, 3).toUpperCase();
  const { day, month, year } = formatCurrentDate();
  const mobileSuffix = mobileNumber.slice(-3);
  const hash = random_hash()
  return `${certificatePrefix}${day}${month}${year}${hash}${mobileSuffix}`;
}

const callNow = (userData) => {
  console.log(userData)
  const sanitizedMobile = userData.agentDetails.sa_contact.toString().replace(' ', '');
  console.log(sanitizedMobile);
  return sanitizedMobile
}

const chatOnWA = (userData) =>{
  const msg = `Hi I have applied for *${userData.certificate}* and my *Application ID* is ${userData.cer_uid}
Urgent Requirement: ${userData.urgent_state ? 'Yes' : 'No'}`;
  const sanitizedMobile = userData.agentDetails.sa_contact.toString().replace(' ', '').replace('+','');
  console.log(sanitizedMobile);
  return `https://wa.me/${sanitizedMobile}?text=${msg}`;
}

const handleCancel = async (chatId, callbackQuery) => {
    try {
      const user = callbackQuery.from; // Extract user info
  
      // Find the certificate that was selected based on callback data
      const selectedCertId = callbackQuery.message.text.split('\n')[0]; // Assuming certificate ID is in the callback data
      console.log(selectedCertId);
      // Create the user information object
      const userInfo = {
        first_name: user.first_name,
        last_name: user.last_name,
        certificate: selectedCertId ? selectedCertId : 'Unknown',
        time: new Date().toLocaleString(),
        type: 'abandoned_bot',
      };
  
      console.log(userInfo)
  
      // Remove inline buttons by editing the message
      const removeInlineKeyboard = {
        inline_keyboard: []  // Set an empty inline keyboard to remove buttons
      };
    
      // Use Promise.all to handle multiple async tasks concurrently
      await Promise.all([
        editMessage(chatId, callbackQuery.message.text, callbackQuery.message.message_id, removeInlineKeyboard, 'Markdown'), // Send user info to the server;
        sendToServer('abandoned', userInfo), 
        sendMessage(chatId, "Your request has been cancelled.")  // Send cancellation message
      ]);
      
    } catch (error) {
      console.error("Error handling cancel:", error);
    }
};

const handleProceed = async (chatId, callbackQuery) => {
    try {
        const certificates = certificatesCache.get('certificates'); // Retrieve the stored certificates
        let services;
        if (servicesCache.get('voterid_services')) {services = servicesCache.get('voterid_services')}
        else services = servicesCache.get('aadhar_services')

        if (!certificates && !services) {
          console.log("No certificates found in the cache.");
          sendMessage(chatId, 'Please restart the bot');
          return;
        }
        let currentService;

        if (certificates) {
          // Find the certificate that was selected based on callback data
          const selectedCertId = callbackQuery.message.text.split('\n')[0]; // Assuming certificate ID is in the callback data
          currentService = certificates.find(certificate => certificate.id === selectedCertId);

          setSession(chatId, {
            certificate: currentService.data.certificate_name,
            cer_code: currentService.data.certificate_code,
            input_state: false,
          });
          console.log(getSession(chatId));
        } else if (services) {
          // Find the certificate that was selected based on callback data
          const selectedSertId = callbackQuery.message.text.split('\n')[0]; // Assuming certificate ID is in the callback data
          currentService = services.find(certificate => certificate.id === selectedSertId);

          setSession(chatId, {
            certificate: currentService.data.service_name,
            input_state: false,
          });
          console.log(getSession(chatId));
        }

        const reqDocs = currentService.data.required_docs.map((doc) => doc.trim()).join('\n');
        const fee = currentService.data.fee.map((fee) => fee.trim()).join('\n');
   
        const text = 
`
*${currentService.data.certificate_code ? currentService.data.certificate_name:currentService.data.service_name }*
   
*Required Documents:*
${reqDocs}
   
*Fee Breakdown:*
${fee}`

        await sendMessage(chatId, "*🥳 Great! Lets proceed further*",'','Markdown');

        // Use Promise.all to handle multiple async tasks concurrently
        await Promise.all([
          editMessage(chatId, text, callbackQuery.message.message_id, '', 'Markdown'), // Send user info to the server;
        ]);
        await handleUserInputs(chatId);
        
      } catch (error) {
        console.error("Error handling cancel:", error);
      }
}

const handleUserInputs = async (...args) => {
    const chatId = args[0];
    const message = args[1];
    try {
        // Check if the user is in the middle of an input flow
        let userSession = getSession(chatId);
        console.log(userSession)

          if (!userSession.input_state) {
            // Start the input flow if user is not yet in session
            userSession = {...userSession,
               step: 1, 
               inputs: [] 
              };
            userSession.input_state = true
            await sendMessage(chatId, "*May I have your name? 😊*", '', 'Markdown');
            userSession.step = 2;
            setSession(chatId, userSession);
          }
            // User is in the middle of providing inputs
          else if (userSession.step === 2) {
              userSession.inputs.push(message.text);
              userSession.step = 3;
              await sendMessage(chatId, "*And your email for updates? 📬*", '', 'Markdown');
              setSession(chatId, userSession);
          } else if (userSession.step === 3) {

              const validMail= await validateEmail(chatId, message.text)
              if (validMail) {
                userSession.inputs.push(validMail);
                userSession.step = 4;
                await sendMessage(chatId, "*Lastly, the mobile number for contact? 📞*", '', 'Markdown');
                setSession(chatId, userSession);
              }
          } else if (userSession.step === 4) {
              const validMobile = await validateMobile(chatId, message.text);
              if (validMobile) {
                userSession.inputs.push(validMobile);
                userSession.step = 5; // All inputs collected
                setSession(chatId, userSession);
                await sendUrgencyOptions(chatId);
              }
          }
    } catch (error) {
        console.error("Error handling message:", error);
    }
};

const sendUrgencyOptions = async (chatId) => {

    const replyMarkup = {
        inline_keyboard: [
            [{ text: "No", callback_data: "urgent_no" }, { text: "Yes", callback_data: "urgent_yes" }]
        ]
    };
    await sendMessage(chatId, "*Do you want to proceed urgently with your certificate?*", replyMarkup, 'Markdown');
};

const showConfirmation = async (chatId, urgent_status, messageId) => {
try {

    await editMessage (chatId, "*Your requirement is urgent*", messageId, '', 'Markdown' )
    let userInputData = getSession(chatId);
    userInputData = {
      ...userInputData,
      urgent_state: urgent_status ? true:false,
      name: userInputData.inputs[0],
      mobile: userInputData.inputs[2],
      email: userInputData.inputs[1]
    }
    setSession(chatId, userInputData);
    let msgText;

    if (userInputData.urgent_state) {
      msgText = `
*Application Summary*
      
*Name:* ${userInputData.inputs[0]}
*Email:* ${userInputData.inputs[1]}
*Mobile:* ${userInputData.inputs[2]}
      
*${userInputData.cer_code ? 'Certificate' : 'Service'}:* ${userInputData.certificate}
*Urgent Requirement:* ${userInputData.urgent_state ? 'Yes' : 'No'}
`
    } else {
      msgText = `
*Application Summary*
            
*Name:* ${userInputData.inputs[0]}
*Mobile:* ${userInputData.inputs[1]}
*Email:* ${userInputData.inputs[2]}
            
*${userInputData.cer_code ? 'Certificate' : 'Service'}:* ${userInputData.certificate}
*Urgent Requirement:* ${userInputData.urgent_state ? 'Yes' : 'No'}
*Preferred Date:* ${userInputData.preferredDate}
*Preferred Time:* ${userInputData.preferredTime}
`
    }
    const reply_markup = {
      inline_keyboard: [
          [{ text: "Sumbit", callback_data: "submit_yes" }]
      ]
    };

    await sendMessage(chatId, msgText, reply_markup, 'Markdown');
}
catch(err){
  await sendMessage(chatId, 'Please restart the bot');
}
}

const submitDetails = async (chatId, messageId) => {
  const init = await sendMessage(chatId, '*Sending your application 🚀, it may take some time⌛*', '', 'Markdown')
  let userData = getSession(chatId);
  let msgText;
  console.log(userData);

  
    let agentData = await fetchAgentData();
    console.log(agentData)
    const removeInlineKeyboard = {
      inline_keyboard: []  // Set an empty inline keyboard to remove buttons
    };
    

    const date = new Date().toLocaleTimeString();
    const time = new Date().toLocaleDateString();
    const date_time = `${date} ${time}`

    userData = {
      ...userData,
      cer_uid: await UniqueId(userData.certificate, userData.mobile),
      agentDetails: agentData,
      time: date_time,
      type: 'submitted_bot'
    }

    setSession(chatId, userData);
    console.log(userData);
    const wa_link =chatOnWA(userData)

    const sucMsg = `
*Congrats, your application for ${userData.certificate} has been submitted successfully*.

*Application Id:* ${userData.cer_uid}

*Customer Support Agent Details*
*Name:* ${userData.agentDetails.sa_name}
*Mobile:* ${userData.agentDetails.sa_contact}

Our customer support agent will contact you soon 🤙
Have a great day 😊
`

  //  const mobile = callNow(userData);
    const reply_markup = {
      inline_keyboard: [
        [{text: '💬 Chat on WA', url:wa_link }]
      ]
    }
    
    await Promise.all([
      await sendToServer('submitted', userData),
      await editMessage(chatId, sucMsg, init.message_id, reply_markup, 'Markdown'),
      await editMessage(chatId, msgText,messageId, removeInlineKeyboard, 'Markdown')
 // Send user info to the server;
    ]);
      
      

}


module.exports = {
    sendToServer,
    handleCancel, 
    handleProceed,
    handleUserInputs,
    showConfirmation,
    submitDetails,
}