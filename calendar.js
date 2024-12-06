const {sendMessage, editMessage, deleteMessage, botStatus} = require('./message');
const {getSession, setSession, certificatesCache} = require('./cache');
const {showConfirmation} = require('./userinteraction');


function getDateKeyboard(year, month, isNextMonth) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let keyboard = [];
  let startDay = 1;
  if (!isNextMonth) {
    startDay = new Date().getDate()
  }

  // Loop through days in the month
  for (let day = startDay; day <= daysInMonth; day += 3) {
    let row = [];  // Initialize a new row

    // Add up to 3 days to the row
    for (let i = 0; i < 3; i++) {
      if (day + i <= daysInMonth) {  // Ensure we don't go past the month's last day
        const date = new Date(year, month, day + i);
        const dateString = date.toISOString().split('T')[0];

        row.push({
          text: (day + i).toString(),  // Display the day number as button text
          callback_data: `date_${dateString}`, // Unique identifier for date selection
        });
      }
    }

    // Push the row to the keyboard if it contains any buttons
    if (row.length) keyboard.push(row);
    console.log(keyboard)
  }

  // Add navigation buttons for previous/next month
  keyboard.push([
    { text: 'Next Month', callback_data: `month_${year}_${month + 1}` },
  ]);

  return { inline_keyboard: keyboard };
}


// Generate inline keyboard for selecting time
function getTimeKeyboard() {
  let keyboard = [];
  let time_key = []
  // Adding hours and minutes as inline buttons (e.g., 10:00, 10:30)
  for (let hour = 7; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
        time_key.push(
          {
            text: timeString,
            callback_data: `time_${timeString}`, // unique identifier for time selection
          },
        );

        // Add a row to the keyboard if we have 3 buttons
        if (time_key.length === 3) {
          keyboard.push(time_key);
          time_key = []; // Reset for the next row
        }
      }
  }
  return keyboard;
}

// Handle callback queries
const showDate_Time = async (chatId, callBackData, messageId) => {
    
    const userSession = getSession(chatId);
    if (callBackData.startsWith('urgent_no')){
      await botStatus(chatId, 'typing');
      await editMessage (chatId, "*Your requirement is not urgent*", messageId, '', 'Markdown' )
      const msgText = '*Okay, then please select a preferred date for applying 📅*';
      const dateObj = new Date()
      const reply_markup = getDateKeyboard(dateObj.getFullYear(), dateObj.getMonth())

      await sendMessage(chatId, msgText, reply_markup, 'Markdown');
    }

    if (callBackData.startsWith('date_')) {
      await deleteMessage(chatId, messageId);
      const selectedDate = callBackData.split('_')[1];
      setSession(chatId, 
        {
          ...userSession,
          preferredDate: selectedDate,
          urgent_status: false,
        }
      )
      
      const dateObj = new Date()
      console.log(getTimeKeyboard(dateObj.getFullYear(), dateObj.getMonth()));
      //Prompt user for time inputs
      const reply_markup = {
        inline_keyboard: getTimeKeyboard(dateObj.getFullYear(), dateObj.getMonth())
      }
      await botStatus(chatId, 'typing');
      await sendMessage(chatId, "*Now please select the time! ⏲️*", reply_markup, 'Markdown');
    }

    if (callBackData.startsWith('time_')) {
      await deleteMessage(chatId, messageId);
      const selectedTIme = callBackData.split('_')[1];
      const selectedDate = userSession.preferredDate;
      const msgText = `You have selected *${selectedTIme}* & *${selectedDate}* as your preferred time and date!`
      setSession(chatId, 
        {
          ...userSession,
          preferredTime: selectedTIme,
        }
      )
      await botStatus(chatId, 'typing');
      await sendMessage(chatId, msgText, '', 'Markdown'); //showing selected date
      console.log(userSession);

      
      //Show Confirmation
      await showConfirmation(chatId, false);
    }

    if (callBackData.startsWith('month_')) {
      const [_, year, month] = callBackData.split('_');
      const newYear = parseInt(year);
      const newMonth = parseInt(month);
      const newKeyboard = getDateKeyboard(newYear, newMonth, true);

      const msgText = '*Okay, then please select a preferred date for applying 📅*';
      await botStatus(chatId, 'typing');
      await editMessage(chatId, msgText , messageId, newKeyboard, 'Markdown');

    }

}




// Export functions if needed elsewhere
module.exports = {
  getDateKeyboard,
  getTimeKeyboard,
  showDate_Time,
};
