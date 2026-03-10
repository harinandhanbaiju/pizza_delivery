const nodemailer = require("nodemailer");

const sendLowStockAlertEmail = async ({ recipients = [], items = [], checkedAt = new Date() }) => {
    if (!recipients.length || !items.length) {
        return { delivered: false, previewUrl: null };
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const dashboardUrl = `${frontendUrl}/`;

    const textSummary = items
        .map((item) => `${item.itemType.toUpperCase()} - ${item.name}: ${item.stockQuantity} (threshold ${item.thresholdValue})`)
        .join("\n");

    const htmlRows = items
        .map(
            (item) => `
                <tr>
                    <td style=\"padding:8px;border:1px solid #ddd;\">${item.itemType}</td>
                    <td style=\"padding:8px;border:1px solid #ddd;\">${item.name}</td>
                    <td style=\"padding:8px;border:1px solid #ddd;\">${item.stockQuantity}</td>
                    <td style=\"padding:8px;border:1px solid #ddd;\">${item.thresholdValue}</td>
                </tr>
            `
        )
        .join("");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === "YOUR_16_CHAR_APP_PASSWORD") {
        console.log(`Low stock alert recipients: ${recipients.join(", ")}\n${textSummary}`);
        return { delivered: false, previewUrl: dashboardUrl };
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipients.join(","),
            subject: `[Pizza Delivery] Low stock alert (${items.length} item${items.length > 1 ? "s" : ""})`,
            html: `
                <h2>Low stock alert</h2>
                <p>Checked at: ${checkedAt.toISOString()}</p>
                <p>The following items are at or below threshold:</p>
                <table style=\"border-collapse:collapse;\">
                    <thead>
                        <tr>
                            <th style=\"padding:8px;border:1px solid #ddd;\">Type</th>
                            <th style=\"padding:8px;border:1px solid #ddd;\">Item</th>
                            <th style=\"padding:8px;border:1px solid #ddd;\">Stock</th>
                            <th style=\"padding:8px;border:1px solid #ddd;\">Threshold</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
                <p style=\"margin-top:12px;\">Open dashboard: <a href=\"${dashboardUrl}\">${dashboardUrl}</a></p>
            `,
        });

        return { delivered: true, previewUrl: dashboardUrl };
    } catch (error) {
        console.log(`Low stock alert email fallback. Recipients: ${recipients.join(", ")}\n${textSummary}`);
        return { delivered: false, previewUrl: dashboardUrl, fallbackReason: "smtp_delivery_failed" };
    }
};

module.exports = sendLowStockAlertEmail;
