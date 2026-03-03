const nodemailer = require('nodemailer');

let transporter = null;
let usingTestAccount = false;

async function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    return transporter;
  }

  // Fallback to Ethereal test account for development when credentials missing
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  usingTestAccount = true;
  console.warn('EMAIL_USER/EMAIL_PASSWORD not set — using Ethereal test account for emails.');
  return transporter;
}

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const tr = await getTransporter();
    const mailOptions = {
      from: 'sarobidy-faliana@m1p13.itu',
      to,
      subject,
      html: htmlContent
    };

    const info = await tr.sendMail(mailOptions);

    if (usingTestAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.info('Email envoyé via Ethereal. Preview URL:', previewUrl);
      return { success: true, previewUrl };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw error;
  }
};

// Template for email verification
const getVerificationEmailTemplate = (verificationLink) => {
  return `
    <h2>Vérification de votre email</h2>
    <p>Cliquez sur le lien ci-dessous pour vérifier votre email:</p>
    <a href="${verificationLink}">Vérifier mon email</a>
    <p>Ce lien expire dans 24 heures.</p>
  `;
};

// Template for password reset
const getPasswordResetTemplate = (resetLink) => {
  return `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:</p>
    <a href="${resetLink}">Réinitialiser mon mot de passe</a>
    <p>Ce lien expire dans 1 heure.</p>
  `;
};

// Template for MFA code
const getMFACodeTemplate = (mfaCode) => {
  return `
    <h2>Votre code de vérification</h2>
    <p>Entrez ce code pour compléter votre authentification:</p>
    <h3 style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${mfaCode}</h3>
    <p>Ce code expire dans 10 minutes.</p>
    <p>Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
  `;
};

module.exports = {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetTemplate,
  getMFACodeTemplate
};
