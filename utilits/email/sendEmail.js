const nodemailer = require("nodemailer");
require("dotenv").config();

const SendEmail = async (email, type, userName, details) => {
  let subject = "";
  let htmlContent = "";

  const companyFooter = `
    <div style="background:#2c3e50;color:white;padding:30px;text-align:center;margin-top:30px;">
      <h3 style="margin:0 0 10px 0;font-size:24px;font-weight:300;">Vehicle Sathi</h3>
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
              <p style="color:#7f8c8d;margin:0;font-size:14px;">This code expires in 1 minutes</p>
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

    case "NewBooking":
      subject = "New Booking Received";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #28a745 0%, #20c997 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">🔧</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">New Booking Received!</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">You have a new service request</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                You have received a new booking request. Here are the details:
              </p>
              
              <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#6c757d;font-size:14px;">Total Amount:</span>
                  <span style="color:#28a745;font-size:24px;font-weight:bold;">₹${details.amount}</span>
                </div>
              </div>
              
              <div style="background:#e3f2fd;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #2196f3;">
                <p style="margin:0;color:#1565c0;font-size:14px;">
                  <strong>Next Steps:</strong><br>
                  • Log in to your dashboard to view complete booking details<br>
                  • Contact the customer to confirm the appointment<br>
                  • Prepare for the scheduled service
                </p>
              </div>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    case "Bookingaccepted":
      subject = "Booking Accepted - Service Confirmed";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #28a745 0%, #20c997 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">✅</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Booking Accepted!</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Your service request has been confirmed</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                Great news! A mechanic has accepted your booking request and will be arriving soon.
              </p>
              
              <div style="background:#d4edda;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
                <p style="margin:0;color:#155724;font-size:14px;">
                  <strong>Service Details:</strong><br>
                  • Total Amount: ₹${details.amount || "N/A"}<br>
                  • Status: Confirmed<br>
                  • The mechanic is on the way to your location
                </p>
              </div>
              
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    case "Bookingcancelled":
      subject = "Booking Cancelled";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #dc3545 0%, #c82333 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">❌</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Booking Cancelled</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Your service request has been cancelled</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                We regret to inform you that your booking has been cancelled. We apologize for any inconvenience caused.
              </p>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    case "Bookingcompleted":
      subject = "Service Completed - Payment Required";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #17a2b8 0%, #138496 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">🏁</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Service Completed!</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Your vehicle service has been completed</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                Excellent! Your vehicle service has been successfully completed. Please proceed with the payment.
              </p>
              
              <div style="background:#d1ecf1;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #17a2b8;">
                <p style="margin:0;color:#0c5460;font-size:14px;">
                  <strong>Service Summary:</strong><br>
                  • Service Status: Completed ✅<br>
                  • Payment: Please pay through cash or online<br>
                </p>
              </div>
              
              <div style="text-align:center;margin:20px 0;">
                <p style="color:#7f8c8d;margin:0;font-size:14px;">Thank you for choosing Vehicle Sathi!</p>
              </div>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    case "Payout":
      subject = "Payout Released - Payment Processed";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #28a745 0%, #20c997 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">💰</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Payout Released!</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Your payment has been processed successfully</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                ${
                  details.description ||
                  "Your payout has been released and processed successfully."
                }
              </p>
              
              <div style="background:#d4edda;padding:25px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                  <span style="color:#155724;font-size:16px;font-weight:bold;">Payout Amount:</span>
                  <span style="color:#28a745;font-size:28px;font-weight:bold;">₹${
                    details.amount || "N/A"
                  }</span>
                </div>
                ${
                  details.transactionid
                    ? `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="color:#155724;font-size:14px;">Transaction ID:</span>
                  <span style="color:#6c757d;font-size:14px;font-family:monospace;">${details.transactionid}</span>
                </div>
                `
                    : ""
                }
              </div>
              
              <div style="background:#e3f2fd;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #2196f3;">
                <p style="margin:0;color:#1565c0;font-size:14px;">
                  <strong>Payment Details:</strong><br>
                  • Status: Successfully Processed ✅<br>
                  • The amount will reflect in your account within 24-48 hours<br>
                  • Keep this email for your records<br>
                  ${
                    details.transactionid
                      ? "• Use Transaction ID for any payment queries"
                      : ""
                  }
                </p>
              </div>
              
              <div style="text-align:center;margin:20px 0;">
                <p style="color:#7f8c8d;margin:0;font-size:14px;">Thank you for your excellent service!</p>
              </div>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    case "Applicationupdated":
      subject = "Application Status Updated";
      htmlContent = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8f9fa;padding:30px;margin:0;">
          <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);overflow:hidden;">
            <div style="text-align:center;padding:40px 30px 30px;">
              <div style="background:linear-gradient(135deg, #6f42c1 0%, #563d7c 100%);color:white;padding:20px;border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;">📋</div>
              <h2 style="color:#2c3e50;margin:0;font-size:28px;">Application Updated</h2>
              <p style="color:#7f8c8d;margin:10px 0 0 0;">Your application status has been updated</p>
            </div>
            
            <div style="padding:30px;">
              <h3 style="color:#2c3e50;margin:0 0 20px 0;">Hello ${userName},</h3>
              <p style="color:#7f8c8d;margin:0 0 20px 0;line-height:1.6;">
                We have an important update regarding your application with Vehicle Sathi.
              </p>
              
              <div style="background:#f8f9fa;padding:25px;border-radius:8px;margin:20px 0;text-align:center;">
                <h4 style="color:#2c3e50;margin:0 0 10px 0;font-size:18px;">Status Update</h4>
                <p style="color:#6f42c1;font-size:16px;font-weight:bold;margin:0;">
                  ${
                    details.description ||
                    "Your application status has been updated."
                  }
                </p>
              </div>
              
            
              
              <div style="text-align:center;margin:20px 0;">
                <p style="color:#7f8c8d;margin:0;font-size:14px;">We appreciate your patience during the review process.</p>
              </div>
            </div>
            
            ${companyFooter}
          </div>
        </div>`;
      break;

    default:
      console.warn(`Unknown email type: ${type}`);
      return Promise.reject(new Error(`Unknown email type: ${type}`));
  }

  const mailOptions = {
    from: process.env.Email,
    to: email,
    subject: new Date().toLocaleDateString(),
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
