import nodemailer from "nodemailer";

/*
this function is for sending mails
It takes 3 args, reciever mail, subject & body
*/

export const sendMail = async (to, subject, body) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    text: body,
  });
};
