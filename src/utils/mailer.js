const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (msg) => {
  try {
    await sgMail.send(msg);
    return true;
  } catch (err) {
    throw err;
  }
};

module.exports = { sendMail };



