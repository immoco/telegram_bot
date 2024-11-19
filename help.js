const {sendMessage} = require('./message')


const tanglish_msg = `
E-Sevai Genie, oru Telegram bot. Namma Genie use panni neenga entha certificates ah irunthaalum apply pannikalam. Certificates mattum illa, Voter ID apply panrathu, Aadhar la address update panrathu, Aadhar PVC Card apply panrathu innum neraya services Genie ungaluku senji tharum. Neenga inimel E-sevai maiyam ku lam poga vendiyathu illa, just namma Genie ya use pannale pothum. Namma Genie ku timings lam kidaiyathu, eppa venum naalum enga irunthaalum neenga use pannikalam. 

*Namma Genie ya epdi use panrathu?*

*STEP 1:* "/start" - intha command ah click pannunga.
*STEP 2:* Enna service use panna poringa nu kekkum, atha correct ah click pannirunga.
*STEP 3:* Aprm, enna documents lam venum, evlo kaasu aagum nu Genie unga kitta sollum. Ellam oru thadava pathutu okay apdina Neenga "proceed" click pannanum.
*STEP 4:* Genie unga kitta details ellam kekkum athellam correct ah kuduthurunga.  
*STEP 5:* Aduthu, Genie ungaluku oru agent ah assign pannum. Antha Agent ungaluku call panni ungaluku thevaaiyana service senji kuduthuruvaanga. 

*Genie loyal aana assistant ah?*

Ama. Genie thannoda users ku loyal ah irukkum. Unga personal details ellam unga permission illama engaiyum pogathu. Once, service mudinjathukku aprm unga details Genie store panni vachukaathu. Genie ungaluku thevai irukkura service mattum than senji kudukkum. Neenga ethana thadava naalum use pannikalam.`
  
const english_msg = `
*Meet E\\-Sevai Genie: Your Digital Assistant*

*What Genie Does:*

\>*Apply for Certificates     *                     
\>*Apply for Voter ID           *               
\>*Aadhar Related Services       *                  

*How to Order Genie:*

\>*1\\. Type /start to launch Genie\\.*
\>*2\\. Select your desired service from the Menu\\.*
\>*3\\. Click "Proceed" after reviewing the required documents and fees\\.*
\>*4\\. Enter your details and book a time slot\\. *
\>*5\\. Genie will assign an agent to assist you and contact you via your provided phone number\\.  *

*Why Trust Genie?*

\>*Privacy\\: Your details are private and protected\\.*
\>*Communication\\: Clear and pre\\-defined conversation\\.*
\>*Reliability\\: Always prioritizes your needs\\. *

*Get started with **E\\-Sevai Genie** and make your application process easy and efficient\\!*
`

const showHelp = async (chatId, callBackData) => {
    if (callBackData === "help_tanglish"){
      await sendMessage(chatId, tanglish_msg, '', 'Markdown');
    }
    else if (callBackData === "help_english"){
        await sendMessage(chatId, english_msg, '', 'MarkdownV2');
    }
}

module.exports = {
    showHelp,
}