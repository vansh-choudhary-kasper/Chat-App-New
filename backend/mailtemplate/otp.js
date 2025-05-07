module.exports = (clientName, otpCode) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              background-color: #fff;
              margin: 0 auto;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h2 {
              color: #DE4E26;
            }
            p {
              font-size: 16px;
              line-height: 1.6;
            }
            .otp-code {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              background-color: #f0f0f0;
              padding: 10px;
              border-radius: 5px;
              text-align: center;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #777;
              text-align: center;
            }
            .footer a {
              color: #DE4E26;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>Hi ${clientName},</p>
            <p>We received a request to reset your password. Use the OTP code below to proceed with the reset:</p>
            <div class="otp-code">${otpCode}</div>
            <p>Please note that this OTP is valid for the next 1 minutes. If you did not request a password reset, you can safely ignore this email.</p>
            <p>Thank you for choosing us,</p>
            <p>The Support Team</p>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to contact us at <a href="mailto:hr@kasperinfotech.org">hr@kasperinfotech.org</a></p>
          </div>
        </body>
      </html>
    `;
  };
  