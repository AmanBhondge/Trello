import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '../config/config.js';

export const sendOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Trello" <${EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification - OTP',
        html: `<p>Your OTP for email verification is: <b>${otp}</b><br/>This OTP is valid for <b>1 minutes</b>.</p>`,
    };

    await transporter.sendMail(mailOptions);
};