require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const nodemailer = require('nodemailer'); // NEW: The email package

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'scofieldbauer4@gmail.com', // Your email
        pass: process.env.EMAIL_PASSWORD   // PASTE YOUR 16-LETTER APP PASSWORD HERE (No spaces)
    },
    tls: {
        rejectUnauthorized: false // <--- THIS IS THE MAGIC FIX
    }
});

app.post('/submit-form', (req, res) => {
    const data = req.body;
    data.Registration_Date = new Date().toLocaleString();

    console.log("----- NEW REGISTRATION RECEIVED -----");
    console.log(data);

    // 1. SAVE TO JSON FILE (Just like before)
    const filePath = './registrations.json';
    let allRegistrations = [];
    if (fs.existsSync(filePath)) {
        const existingData = fs.readFileSync(filePath);
        allRegistrations = JSON.parse(existingData);
    }
    allRegistrations.push(data);
    fs.writeFileSync(filePath, JSON.stringify(allRegistrations, null, 2));
    console.log("✅ Registration saved permanently to registrations.json");

    // 2. SEND THE EMAIL NOTIFICATION
    // We check if it's a student or teacher to use the right data fields
    const name = data.Student_Name || data.Applicant_Name;
    const subject = data.Course || data.Subject;
    const phoneOrCV = data.Phone_Number ? `<p><strong>Phone:</strong> ${data.Phone_Number}</p>` : `<p><strong>CV Link:</strong> <a href="${data.CV_Link}">View CV</a></p>`;

    const mailOptions = {
        from: 'scofieldbauer4@gmail.com',
        to: 'scofieldbauer4@gmail.com', // Sends the email to yourself
        subject: `🚨 New El-Shaddai Registration: ${data.Form_Type}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #0d6efd;">New Registration Received!</h2>
                <hr>
                <p><strong>Form Type:</strong> ${data.Form_Type}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Course / Subject:</strong> ${subject}</p>
                ${phoneOrCV}
                <br>
                <p style="color: #888; font-size: 12px;">Registered on: ${data.Registration_Date}</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log("❌ Email Error:", error);
        // You can optionally add a res.send error message here later
    } else {
        console.log("✅ Email successfully sent to your inbox!");
        
        // 3. SEND SUCCESS PAGE BACK TO THE USER (Moved inside the else block!)
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #0d6efd;">Success!</h1>
                <p>Thank you for registering with El-Shaddai Company.</p>
                <a href="http://127.0.0.1:5500/register.html" style="color: #198754; text-decoration: none; font-weight: bold;">Return to website</a>
            </div>
        `);
    }
    console.log("-----------------------------------------");
});

    // 3. SEND SUCCESS PAGE BACK TO THE USER
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #0d6efd;">Success!</h1>
            <p>Thank you for registering with El-Shaddai Company.</p>
            <a href="http://127.0.0.1:5500/register.html" style="color: #198754; text-decoration: none; font-weight: bold;">Return to website</a>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ El-Shaddai Server is running live on http://localhost:${PORT}`);
});