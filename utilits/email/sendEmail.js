const nodemailer = require("nodemailer");
require("dotenv").config();

const SendEmail = async (email, type, userName, details) => {
  let subject = "";
  let htmlContent = "";

  const companyFooter = `
    <div style="background:#2c3e50;color:white;padding:30px;text-align:center;margin-top:30px;">
      <h3 style="margin:0 0 10px 0;font-size:24px;font-weight:300;">Brindha</h3>
      <p style="margin:0 0 10px 0;color:#bdc3c7;font-size:14px;">www.brindha.com</p>
      <p style="margin:0;color:#bdc3c7;font-size:14px;">Thank you for choosing us!</p>
    </div>
  `;

  switch (type) {
    case "OTP":
      subject = "Your One-Time Password (OTP)";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">🔐</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Security Code</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Enter this code to verify your identity</p>
            </div>
            
            <div style="background:#f8f9fa;padding:30px;text-align:center;margin:0 30px 30px;">
              <div style="font-size:48px;font-weight:bold;color:#667eea;letter-spacing:8px;margin-bottom:15px;">${details.otp}</div>
              <p style="color:#7f8c8d;margin:0;font-size:14px;">This code expires in 10 minutes</p>
            </div>
            
            <div style="background:#e8f4f8;padding:20px;margin:0 30px 30px;border-radius:8px;border-left:4px solid #17a2b8;">
              <p style="margin:0;color:#0c5460;font-size:14px;">
                <strong>Security Tips:</strong><br>
                • Never share this code with anyone<br>
                • We'll never ask for your OTP via phone or email
              </p>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    default:
      return;
  }

  const mailOptions = {
    from: process.env.Email,
    to: email,
    subject: subject + " " + new Date(),
    html: htmlContent,
  };

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.Email,
      pass: process.env.PASSWORD,
    },
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email Error:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info);
      }
    });
  });
};

module.exports = SendEmail;
