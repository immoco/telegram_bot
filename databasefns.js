//Firestore
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config()
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
const db = admin.firestore();
const sheetID = process.env.deployment_ID

const {certificatesCache, servicesCache} = require('./cache');
const {sendMessage, editMessage,botStatus} = require('./message')

const sendDataToSheet = async (dataToSend) => {
  try {
    const response = await axios.post(
      `https://script.google.com/macros/s/${sheetID}/exec?dev=true`, 
      dataToSend, // Send `dataToSend` as the body
      {
        headers: {
          'Content-Type': 'application/json', // Specify content type
        },
      }
    );

    console.log(response)

    console.log("Data sent successfully to the sheet!");
  } catch (error) {
    console.error("Error sending data to sheet:", error);
  }
};


const fetchCertificates = async (collection) => {
    try {
        const certificatesCollection = db.collection(collection); // Replace with your actual collection name
        const certificateSnapshot = await certificatesCollection.get();
        const certificateList = certificateSnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(), // Adjust according to your Firestore document structure
      }));
      return certificateList;
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

const sendCertificatesMenu = async (chatId, callBackData) => {
  
    await botStatus(chatId, 'typing');
    const initialMessage = await sendMessage(chatId, "Fetching Services Details, this takes a few seconds ⌛")
    let reply_markup;
    try {
        if (callBackData === 'tn_certificates'){
            // Fetch the certificates
            let certificates = certificatesCache.get("certificates");
            if (!certificates) {
              certificates = await fetchCertificates('bot_certificates');
              certificatesCache.set("certificates", certificates);
            }
            console.log(certificates)
            // Generate inline keyboard buttons
            const inlineKeyboard = certificates.map((certificate) => [
              {
                text: certificate.data.certificate_name, // Display the certificate name on the button
                callback_data: `certificate_${certificate.id}`, // Unique identifier for each certificate
              },
            ]);

            reply_markup = {
              inline_keyboard: inlineKeyboard
            };
      } else if (callBackData === 'voter_id') {
            // Fetch the certificates
            let services = servicesCache.get("voterid_services");
            if (!services) {
              services = await fetchCertificates('voter_id');
              servicesCache.set("voterid_services", services);
            }
            
            // Generate inline keyboard buttons
            const inlineKeyboard = services.map((service) => [
              {
                text: service.data.service_name, // Display the certificate name on the button
                callback_data: `service_vot_${service.id}`, // Unique identifier for each certificate
              },
            ]);

            reply_markup = {
              inline_keyboard: inlineKeyboard
            };
      } else if (callBackData === 'aadhar_services') {
        // Fetch the certificates
        let services = servicesCache.get("aadhar_services");
        if (!services) {
          services = await fetchCertificates('aadhar_services');
          servicesCache.set("aadhar_services", services);
        }
        
        // Generate inline keyboard buttons
        const inlineKeyboard = services.map((service) => [
          {
            text: service.data.service_name, // Display the certificate name on the button
            callback_data: `service_aad_${service.id}`, // Unique identifier for each certificate
          },
        ]);

        reply_markup = {
          inline_keyboard: inlineKeyboard
        };
      }

      // Send a message with the inline keyboard
      await editMessage(chatId, "*Choose an option from the list below.*", initialMessage.message_id, reply_markup,'Markdown' )

    } catch (error) {
      console.error("Error sending certificates menu:", error);
    }
  };

const sendReqDocsandFee = async (chatId, selected_cert) => {
    console.log(selected_cert)

    await botStatus(chatId, 'typing');
    await sendMessage(chatId, `You have selected *${selected_cert.id}* ✅`,'','Markdown');
    const initialMessage = await sendMessage(chatId, '⏳ Please wait while getting required docs',{},'Markdown');
 
    try {
     const reqDocs = selected_cert.data.required_docs.map((doc) => doc.trim()).join('\n');
     const fee = selected_cert.data.fee.map((fee) => fee.trim()).join('\n');
     let currentService;
     if (selected_cert.data.certificate_code) {
        currentService = '_certificates'
     } else {
        currentService = '_services'
     }
     
     const text = `
*${selected_cert.data.certificate_code ? selected_cert.data.certificate_name:selected_cert.data.service_name}*

*Required Documents:*
${reqDocs}

*Fee Breakdown:*
${fee}

*Do you want to proceed further?*`
 
     const reply_markup = {
       inline_keyboard: [[{text: "Cancel", callback_data: "handle_cancel"},{text: "Proceed", callback_data: `handle_proceed${currentService}`}],
     ]};
 
     // Send a message with the inline keyboard
     editMessage(chatId, text, initialMessage.message_id, reply_markup, 'Markdown')
 
   } catch (error) {
     console.error("Error sending certificates menu:", error);
   }
 };

 const fetchAgentData = async () => {
    try {
      const doc = await db.collection('customer_support_agents').doc('csa_01').get();
      if (doc.exists) {
        const docData = doc.data();
        console.log(docData);

        return {
          sa_name: docData.sa_name,
          sa_contact: docData.sa_contact,
        }
      }
    } catch (error) {
      console.log("Error found:", error);
    }
 }

 module.exports = {
    sendCertificatesMenu, 
    sendReqDocsandFee,
    fetchCertificates,
    fetchAgentData,
    sendDataToSheet
 }