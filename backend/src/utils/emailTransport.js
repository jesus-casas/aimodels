const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Email templates
const emailTemplates = {
    confirmation: (link) => ({
        subject: 'Auth424: Confirm Your Email',
        text: `Please confirm your email by clicking the link here: ${link}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Auth424: Confirm Your Email</h2>
                <p>Please confirm your email by clicking the button below:</p>
                <a href="${link}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Confirm Email
                </a>
                <p>If you didn't request this email, you can safely ignore it.</p>
            </div>
        `
    }),
    resendConfirmation: (link) => ({
        subject: 'Auth424: Resend Email Confirmation',
        text: `Here's your new confirmation link: ${link}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Auth424: Resend Email Confirmation</h2>
                <p>Here's your new confirmation link:</p>
                <a href="${link}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Confirm Email
                </a>
                <p>If you didn't request this email, you can safely ignore it.</p>
            </div>
        `
    })
};

// Function to send email
const sendEmail = async (to, link, type = 'confirmation') => {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV MODE] Skipping actual email sending.');
            return { message: 'Skipped email sending in development.' };
        }

        const template = emailTemplates[type];
        if (!template) {
            throw new Error(`Invalid email type: ${type}`);
        }

        const { subject, text, html } = template(link);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail
}; 
