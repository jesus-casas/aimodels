import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sendEmail } from '../utils/emailTransport.js';

// Load .env file from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function sendTestEmail() {
  try {
    console.log('Environment variables loaded:', {
      EMAIL_USER: process.env.EMAIL_USER ? '***' : 'not found',
      EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'not found',
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not found in environment variables');
    }

    const testEmail = 'example@example.com';
    const testLink = 'https://example.com/test';

    console.log('Sending test email to:', testEmail);
    console.log('Using email:', process.env.EMAIL_USER);

    const result = await sendEmail(testEmail, testLink);
    console.log('Test email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

// Send test email
sendTestEmail();