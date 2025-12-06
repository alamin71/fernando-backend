// import nodemailer from "nodemailer";
// import config from "../config";
// import { errorLogger, logger } from "../shared/logger";
// import { ISendEmail } from "../types/email";

// const transporter = nodemailer.createTransport({
//   host: config.email.host,
//   port: Number(config.email.port),
//   secure: false,
//   auth: {
//     user: config.email.user,
//     pass: config.email.pass,
//   },
// });

// const sendEmail = async (values: ISendEmail) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `${config.email.email_header} ${config.email.from}`,
//       to: values.to,
//       subject: values.subject,
//       html: values.html,
//     });

//     logger.info("Mail send successfully", info.accepted);
//   } catch (error) {
//     errorLogger.error("Email", error);
//   }
// };
// const sendEmailForAdmin = async (values: ISendEmail) => {
//   try {
//     const info = await transporter.sendMail({
//       from: `"${values.to}" <${values.to}>`,
//       to: config.email.user,
//       subject: values.subject,
//       html: values.html,
//     });

//     logger.info("Mail send successfully", info.accepted);
//   } catch (error) {
//     errorLogger.error("Email", error);
//   }
// };

// export const emailHelper = {
//   sendEmail,
//   sendEmailForAdmin,
// };
import nodemailer from "nodemailer";
import config from "../config";
import { errorLogger, logger } from "../shared/logger";
import { ISendEmail } from "../types/email";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: Number(config.email.port) === 465, // 465 হলে secure:true হবে
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"${config.email.email_header}" <${config.email.user}>`, // <-- must match EMAIL_USER
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info("Mail sent successfully", info.accepted);
  } catch (error) {
    errorLogger.error("Email", error);
  }
};

const sendEmailForAdmin = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"${config.email.email_header}" <${config.email.user}>`, // <-- always send as Gmail user
      to: config.email.user,
      subject: values.subject,
      html: values.html,
    });

    logger.info("Mail sent successfully", info.accepted);
  } catch (error) {
    errorLogger.error("Email", error);
  }
};
// 1️Payment success mail
const sendPaymentSuccessEmail = async (
  to: string,
  userName: string,
  amount: number
) => {
  await sendEmail({
    to,
    subject: "Payment Successful - Subscription Pending Approval",
    html: `
      <p>Hi ${userName},</p>
      <p>Your payment of <b>$${amount}</b> was successful.</p>
      <p>Your subscription is now pending admin approval. You will be notified once it is approved.</p>
      <p>Thank you for your purchase!</p>
    `,
  });
};

// 2Subscription approval mail
const sendSubscriptionApprovedEmail = async (to: string, userName: string) => {
  await sendEmail({
    to,
    subject: "Welcome! Your Subscription is Approved 🎉",
    html: `
      <p>Hi ${userName},</p>
      <p>Congratulations! Your subscription has been approved by admin.</p>
      <p>You can now login using your registered email & password.</p>
      <p>Enjoy our services 🚀</p>
    `,
  });
};

export const emailHelper = {
  sendEmail,
  sendEmailForAdmin,
  sendPaymentSuccessEmail,
  sendSubscriptionApprovedEmail,
};
