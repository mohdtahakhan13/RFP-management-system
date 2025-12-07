# RFP Management System

An AI-powered Request for Proposal management system that automates vendor proposal handling, from RFP creation to AI-assisted comparison and recommendation.

---

## 1. Project Setup

### a. Prerequisites

| Requirement       | Version | Notes                   |
| ----------------- | ------- | ----------------------- |
| Node.js           | v18+    | Required for ES modules |
| MongoDB           | v6+     | Local or MongoDB Atlas  |
| Gmail Account     | -       | With 2FA enabled        |
| Google AI API Key | -       | Gemini 2.5 Flash model  |

### b. Installation Steps

```bash
# Clone the repository
git clone <repository-url>
cd RFP

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### c. Email Configuration

1. **Setup Mailtrap (for Sending)**:

   - Create an account at [Mailtrap.io](https://mailtrap.io)
   - Go to **Inboxes** → **SMTP Settings**
   - Copy your `User`, `Password`, `Host`, and `Port`

2. **Setup Gmail (for Receiving)**:

   - **Enable 2-Step Verification** in your Google Account
   - **Generate App Password**: [Google App Passwords](https://myaccount.google.com/apppasswords)
   - **Enable IMAP** in Gmail Settings

3. **Configure Backend Environment**:
   Create `backend/.env`:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/rfp_management
   GEMINI_API_KEY=your_gemini_api_key

   # Email Sending (Mailtrap SMTP)
   EMAIL_HOST=sandbox.smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_mailtrap_user
   EMAIL_PASS=your_mailtrap_password
   EMAIL_FROM=noreply@rfpsystem.com

   # Email Receiving (Gmail IMAP)
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=your_gmail@gmail.com
   IMAP_PASS=your_gmail_app_password

   FRONTEND_URL=http://localhost:5173
   ```

4. **Configure Frontend Environment**:
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### d. Running Locally

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

### e. Seed Data / Initial Setup

To populate the database with test data (2 Vendors, 1 RFP, 2 Responses):

```bash
# From the root directory
node backend/test/seedDemoData.js
```

This creates a ready-to-test scenario instantly.

---

## 2. Tech Stack

### a. Technologies Used

| Layer             | Technology               | Purpose                          |
| ----------------- | ------------------------ | -------------------------------- |
| **Frontend**      | React 18 + Vite          | UI framework with fast HMR       |
| **Styling**       | Tailwind CSS             | Utility-first CSS                |
| **Animations**    | Framer Motion            | Smooth UI animations             |
| **Charts**        | Recharts                 | Data visualization               |
| **HTTP Client**   | Axios                    | API requests                     |
| **Backend**       | Express.js               | REST API server                  |
| **Database**      | MongoDB + Mongoose       | Document storage                 |
| **AI Provider**   | Google Gemini 2.5 Flash  | RFP parsing, proposal comparison |
| **Email (SMTP)**  | Nodemailer               | Sending emails                   |
| **Email (IMAP)**  | imap-simple + mailparser | Receiving & parsing emails       |
| **Email Storage** | MongoDB (Email model)    | Persistent email storage         |

---

## 3. API Documentation

### a. Main Endpoints

#### RFP Endpoints

| Method | Path                    | Description            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/api/rfps`             | List all RFPs          |
| GET    | `/api/rfps/:id`         | Get RFP with proposals |
| POST   | `/api/rfps`             | Create RFP             |
| POST   | `/api/rfps/:id/send`    | Send RFP to vendors    |
| POST   | `/api/rfps/:id/compare` | AI comparison          |

**POST /api/rfps** - Create RFP

```json
// Request
{
  "title": "Laptop Procurement",
  "description": "Need 10 laptops...",
  "requirements": [{ "item": "RAM", "specification": "16GB" }],
  "budget": { "min": 10000, "max": 15000 }
}

// Success Response (201)
{ "success": true, "data": { "_id": "...", "title": "..." } }

// Error Response (400)
{ "success": false, "error": "Title is required" }
```

#### AI Endpoints

| Method | Path                     | Description                  |
| ------ | ------------------------ | ---------------------------- |
| POST   | `/api/ai/parse-rfp`      | Parse natural language → RFP |
| POST   | `/api/ai/parse-response` | Parse email → proposal       |

**POST /api/ai/parse-rfp**

```json
// Request
{ "description": "Need 10 Dell laptops with 16GB RAM, budget $15k" }

// Success Response (200)
{
  "success": true,
  "data": {
    "title": "Dell Laptop Procurement",
    "requirements": [...],
    "budget": { "min": 15000, "max": 15000 }
  }
}
```

#### Email Endpoints

| Method | Path                      | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | `/api/emails/test`        | Test connection     |
| POST   | `/api/emails/check`       | Check inbox         |
| POST   | `/api/emails/simulate`    | Simulate email      |
| POST   | `/api/emails/process/:id` | Process to proposal |

---

## 4. Decisions & Assumptions

### a. Key Design Decisions

| Decision                             | Rationale                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| **MongoDB email storage**            | Emails stored in `emails` collection for persistence and proper DB-level management     |
| **UNSEEN-only IMAP fetch**           | Only fetches unread emails from Gmail, marks as read after saving to prevent duplicates |
| **RFP ID embedded in email subject** | Format: `[RFP-{id}]` enables automatic linking of vendor replies                        |
| **AI-based scoring (0-100)**         | Normalized scores allow fair comparison across different proposal formats               |
| **Vendor auto-creation from email**  | When processing emails, vendors are created if not found, reducing manual work          |
| **Simulated email for testing**      | Allows full workflow testing without waiting for IMAP (which can be slow/timeout)       |
| **Same credentials for SMTP/IMAP**   | Gmail App Password works for both, simplifying configuration                            |

### b. Assumptions Made

| Assumption                                      | Impact                                                        |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Vendors reply to the same email thread          | Subject line matching depends on "RFP:" or "Re: RFP:" pattern |
| Proposal emails are in plain text or basic HTML | Complex attachments (PDF, DOCX) are not parsed                |
| Hybrid Email Setup                              | SMTP via Mailtrap (testing) or Brevo (prod), IMAP via Gmail   |
| Single currency per RFP                         | Multi-currency comparison not implemented                     |
| English language proposals                      | AI parsing optimized for English text                         |

---

## 5. AI Tools Usage

### a. Tools Used

- GitHub Copilot (code completion)
- Cursor AI (code assistance)

### b. What They Helped With

- Boilerplate code generation for Express routes and React components
- Debugging IMAP connection issues
- Structuring Mongoose schemas

### c. Key Learnings

- AI suggestions improved code consistency across the project
- Prompt specificity significantly impacts output quality
- Manual review remains essential for business logic

---

## Author

**Name:** Mohd. Taha Khan
**Email:** mohdtahakhan13@gmail.com
