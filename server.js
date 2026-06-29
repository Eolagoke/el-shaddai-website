const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Path to the local database file
const DATA_FILE = path.join(__dirname, 'registrations.json');

// Handle Form Submissions
app.post('/submit-form', (req, res) => {
    const data = req.body;
    
    // Add a registration timestamp
    data.Registration_Date = new Date().toLocaleString();

    console.log("=========================================");
    console.log("📥 New Registration Form Received!");
    console.log("Data:", data);

    // 1. SAVE REGISTRATION PERMANENTLY TO JSON FILE
    let currentData = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            currentData = JSON.parse(fileContent);
        } catch (e) {
            console.log("⚠️ Error parsing JSON file, resetting array.");
        }
    }

    currentData.push(data);

    fs.writeFile(DATA_FILE, JSON.stringify(currentData, null, 4), (err) => {
        if (err) {
            console.log("❌ Database Write Error:", err);
            return res.status(500).send("Server Error: Could not save data.");
        }
        
        console.log("✅ Registration saved permanently to registrations.json");

        // 2. SEND THE EMAIL NOTIFICATION VIA RESEND API (Firewall Bypass)
        const name = data.Student_Name || data.Applicant_Name || "New Applicant";
        const subject = data.Course || data.Subject || "General Registration";
        const phoneOrCV = data.Phone_Number ? `<p><strong>Phone:</strong> ${data.Phone_Number}</p>` : `<p><strong>CV/Link:</strong> ${data.CV_Link || 'None provided'}</p>`;

        console.log("⏳ Handing email over to Resend API...");

        fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'El-Shaddai Server <onboarding@resend.dev>', // Keep this exactly as onboarding@resend.dev
                to: 'scofieldbauer4@gmail.com',                 // Replace with your Resend login email
                subject: `New Registration: ${subject}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                        <h2 style="color: #0d6efd; margin-bottom: 20px;">New Registration Received</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        ${phoneOrCV}
                        <br>
                        <p style="color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px;">Registered on: ${data.Registration_Date}</p>
                    </div>
                `
            })
        })
        .then(response => response.json())
        .then(apiResponse => {
            if (apiResponse.error) {
                console.log("❌ Resend API Error:", apiResponse.error);
                // Even if email fails, we send the success page because the data is safely saved in the JSON database
                sendSuccessPage(res);
            } else {
                console.log("✅ Email successfully sent via API!", apiResponse);
                sendSuccessPage(res);
            }
            console.log("-----------------------------------------");
        })
        .catch(error => {
            console.log("❌ Server Fetch Error:", error);
            sendSuccessPage(res);
            console.log("-----------------------------------------");
        });
    });
});

// Helper function to send the success HTML response back to the browser
function sendSuccessPage(res) {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #0d6efd;">Success!</h1>
            <p>Thank you for registering with El-Shaddai Company.</p>
            <a href="http://127.0.0.1:5500/register.html" style="color: #198754; text-decoration: none; font-weight: bold;">Return to website</a>
        </div>
    `);
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running live on port ${PORT}`);
});