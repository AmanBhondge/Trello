import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '../config/config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

// 🔐 Send OTP for signup
export const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Trello" <${EMAIL_USER}>`,
        to: email,
        subject: 'Email Verification - OTP',
        html: `<p>Your OTP for email verification is: <b>${otp}</b><br/>This OTP is valid for <b>1 minute</b>.</p>`,
    };

    await transporter.sendMail(mailOptions);
};

// 🔐 Send OTP for password reset
export const sendOTPToResetPassword = async (email, otp) => {
    const mailOptions = {
        from: `"Trello" <${EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset - OTP',
        html: `<p>Your OTP for Password Reset is: <b>${otp}</b><br/>This OTP is valid for <b>2 minutes</b>.</p>`,
    };

    await transporter.sendMail(mailOptions);
};

// 📩 Send board invite email
export const sendInviteEmail = async (email, boardTitle, inviterName) => {
    const mailOptions = {
        from: `"Trello" <${EMAIL_USER}>`,
        to: email,
        subject: `You're invited to join the board "${boardTitle}"`,
        html: `
            <h3>Hello!</h3>
            <p><strong>${inviterName}</strong> has invited you to collaborate on the board: <b>${boardTitle}</b>.</p>
            <p>Please login to your account to view and participate in the board.</p>
            <br/>
            <p>— The Trello Team</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};
