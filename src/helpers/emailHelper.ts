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
  secure: Number(config.email.port) === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  // Improve robustness with explicit timeouts
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  // optional: set a socket timeout as well
  socketTimeout: 20_000,
});

const sendEmail = async (values: ISendEmail) => {
  const maxAttempts = 3;
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const info = await transporter.sendMail({
        from: `"${config.email.email_header}" <${config.email.user}>`, // <-- must match EMAIL_USER
        to: values.to,
        subject: values.subject,
        html: values.html,
      });

      logger.info("Mail sent successfully", {
        to: values.to,
        accepted: info.accepted,
      });
      return info;
    } catch (error: any) {
      lastErr = error;
      errorLogger.error(`Email send attempt ${attempt} failed`, {
        err: String(error),
      });

      // If it's the last attempt, break and return after logging
      if (attempt >= maxAttempts) break;

      // Exponential backoff before retrying
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // All attempts failed — log detailed error and return null
  errorLogger.error("All email send attempts failed", { error: lastErr });
  // If in development, try Ethereal test account as a fallback so devs can see the email
  try {
    if (process.env.NODE_ENV === "development" || !config.email.host) {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const testInfo = await testTransporter.sendMail({
        from: `"${config.email.email_header || "Dev"}" <${testAccount.user}>`,
        to: values.to,
        subject: values.subject,
        html: values.html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(testInfo);
      logger.info("Ethereal dev email sent", { to: values.to, previewUrl });
      return testInfo;
    }
  } catch (ethErr) {
    errorLogger.error("Ethereal fallback failed", { err: String(ethErr) });
  }

  return null;
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
