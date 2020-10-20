const nodemailer = require('nodemailer');


let transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
       user: 'han33407@gmail.com',
       pass: 'jpioqiojrbtkogyv'
    }
  });
  
  const mailHandler = {
      sendConfirmation: async (email, token) => {
        const message = {
            from: 'noreply@matcha.com', 
            to: email,        
            subject: 'Account confirmation',
            html: `<h1>Welcome to Matcha</h1><br>\
            <h3>Please confirm your account by visiting the link below</h3>\
            <a style="color: blue;" href=\"http://138.68.94.163:8080/confirm/${token}\">Confirm</a>` 
          };
          transport.sendMail(message, (err, info) =>{
            if (err) {
              throw new Error("email was not sent, please check email and try again ...")
            } else {
              return true
            }
          })
      },
      sendReset: async (email, token) => {
        const message = {
            from: 'noreply@matcha.com', 
            to: email,        
            subject: 'Reset Password email',
            html: `<h1>Matcha</h1><br>\
            <h3>Please visiting the link below so we can send your reset password email</h3>\
            <a style="color: red;" href=\"http://138.68.94.163:8080/reset/${token}\">Reset</a>\
            <br>
            <p>If you have not requested your password to be reset do not click reset, contact support at: support@matcha.com</p>` 
          };
          transport.sendMail(message, (err, info) =>{
            if (err) {
              throw new Error("email was not sent, please check email and try again ...")
            } else {
              return true
            }
          })
      }
  }




  module.exports = mailHandler