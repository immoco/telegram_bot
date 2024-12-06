const axios = require('axios');
const {sendMessage, editMessage, deleteMessage, botStatus} = require('./message');
const {townCache} = require('./cache');

require('dotenv').config()

const tneb_sheetID = process.env.tneb_deploy_ID;

const fetch_towns = async () => {
    try {
        const response = await axios.get(
          `https://script.google.com/macros/s/${tneb_sheetID}/exec?dev=true`, 
          {
            headers: {
              'Content-Type': 'application/json', // Specify content type
            },
          }
        );
    
        console.log(response)
    
        console.log("Data received successfully from the sheet!");
      } catch (error) {
        console.error("Error receiving data from sheet:", error);
      }
}

const askTown = async (chatId, callBackData) => {
    //Fetch Towns List from Sheet
    towns=townCache.get("town_List");
    if (!towns) {
        towns= await fetch_towns()
    }
}