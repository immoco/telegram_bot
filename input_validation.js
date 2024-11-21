const {sendMessage} = require('./message')
const validateEmail = async (chatId, email) => {
    if (email.match(/.+@gmail\.com$/)) {
      return email
    }
    else {
      await sendMessage(chatId, '*Kindly send me a valid email! 🥺*', '', 'Markdown')
      return false
    }
  }
  
  const validateMobile = async (chatId, mobile) => {
    if (mobile.match(/^\d{10}$/)) {
      return mobile
    }
    else{
      await sendMessage(chatId, '*kindly send me a valid 10 digit mobile number! 🙃*', '', 'Markdown')
      return false
    }
  }

module.exports = {
    validateMobile
}