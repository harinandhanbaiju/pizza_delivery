const nodemailer = require("nodemailer");

const sendVerificationEmail = async (email, token) => {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const verificationLink = `${backendUrl}/api/users/verify-email/${token}`;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === "YOUR_16_CHAR_APP_PASSWORD") {
        console.log(`Verification link for ${email}: ${verificationLink}`);
        return { previewUrl: verificationLink };
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your email",
        html: `
            <h2>Welcome to Pizza Delivery</h2>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationLink}">${verificationLink}</a>
        `,
    });

    return {};
};

module.exports = sendVerificationEmail;
