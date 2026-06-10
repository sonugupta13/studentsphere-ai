# StudentSphere AI - Authentication Module

This is the complete production-ready authentication module for **StudentSphere AI**, implemented using the MERN Stack (MongoDB, Express, React, Node.js). 

## Technology Stack

- **Frontend**: React (Vite), Tailwind CSS v3, Redux Toolkit (state management), Axios (API client), React Router DOM (routing & guards).
- **Backend**: Node.js, Express.js, Mongoose (MongoDB ODM), Passport.js (Google OAuth 2.0).
- **Security**: JWT (HttpOnly, Secure cookie-based storage), Bcrypt (password hashing), Helmet (HTTP headers protection), Express Rate Limit (brute force protection), Express Mongo Sanitize (NoSQL injection prevention).

---

## Folder Structure

```
studentsphere-ai/
├── README.md              # Documentation
├── backend/               # Express API
│   ├── config/
│   │   ├── db.js          # MongoDB database connector
│   │   └── passport.js    # Passport Google OAuth strategy
│   ├── controllers/
│   │   └── authController.js # Auth actions (Register, Login, Password Reset)
│   ├── middleware/
│   │   ├── authMiddleware.js # Route access guards
│   │   ├── errorMiddleware.js# API custom JSON error formatter
│   │   └── rateLimiter.js # IP rate limiter rules
│   ├── models/
│   │   └── User.js        # MongoDB Mongoose User Model
│   ├── routes/
│   │   └── authRoutes.js  # Auth routing mapping
│   ├── utils/
│   │   └── generateToken.js # Signs JWT & sets cookie
│   ├── .env.example       # Template env configuration
│   ├── .env               # Active development configuration
│   ├── package.json       # Backend packages config
│   └── server.js          # App bootstrap and security initialization
└── frontend/              # Vite React app
    ├── index.html         # HTML layout template
    ├── package.json       # Frontend packages config
    ├── postcss.config.js  # PostCSS config
    ├── tailwind.config.js # Tailwind theme mapping
    ├── vite.config.js     # Dev proxy & Vite build settings
    └── src/
        ├── App.jsx        # Routing guards & state initialization
        ├── main.jsx       # App DOM renderer
        ├── index.css      # Core tailwind stylesheet & transitions
        ├── components/
        │   ├── ProtectedRoute.jsx # Checks user login status
        │   ├── AdminRoute.jsx     # Restricts routes to Admin role
        │   └── Toast.jsx          # Micro-animation notifications
        ├── pages/
        │   ├── Login.jsx          # Login Form & Google Sign-In
        │   ├── Register.jsx       # Register Form with Password Strength Meter
        │   ├── ForgotPassword.jsx # Request recovery link (Dev logs helper)
        │   ├── ResetPassword.jsx  # Modify password token validator
        │   ├── Dashboard.jsx      # Student interface & role test
        │   └── AdminDashboard.jsx # Admin management portal & live statistics
        ├── redux/
        │   ├── store.js           # Redux central store
        │   └── slices/
        │       └── authSlice.js   # Auth async thunks
        └── utils/
            └── api.js             # Axios client instance
```

---

## Setup & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### Step 1: Clone & Configure Backend
1. Go to the `backend/` directory.
2. Edit the `.env` file with your environment variables (a preconfigured `.env` is created for default local setup).
   ```env
   # Server Settings
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/studentsphere

   # Secrets
   JWT_SECRET=supersecretjwtkey12345
   JWT_EXPIRES_IN=30d

   # Google OAuth (Register on Google Cloud Developer Console)
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

### Step 2: Install dependencies & Start Server
Run the following commands inside `backend/` directory:
```bash
npm install
npm run dev
```
The server will connect to MongoDB and start listening on port `5000`.

### Step 3: Install dependencies & Start Frontend
Run the following commands inside `frontend/` directory:
```bash
npm install
npm run dev
```
The client portal will start on port `5173` (with requests proxying automatically to backend on `/api/*`).

---

## API Documentation

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register a student account with fullName, email, and password. |
| **POST** | `/api/auth/login` | Public | Login credentials check. Returns HttpOnly cookie. |
| **POST** | `/api/auth/logout` | Private | Clears client token cookie. |
| **GET** | `/api/auth/me` | Private | Returns details of current authenticated user. |
| **POST** | `/api/auth/forgot-password` | Public | Generates reset token. Logs link in backend console or sends SMTP email. |
| **POST** | `/api/auth/reset-password/:token` | Public | Updates user password and performs auto-login. |
| **GET** | `/api/auth/google` | Public | Redirects user to Google OAuth Concent Screen. |
| **GET** | `/api/auth/google/callback` | Google | Callback handler. Creates Google account, assigns cookie, redirects to Dashboard. |
| **GET** | `/api/admin/stats` | Admin-Only | Live system metrics (total student count, health check). |

---

## Verification & Testing Flows

### 1. User Registration & Strength Indicator
1. Go to `http://localhost:5173/register`.
2. Fill out name and email.
3. Type a password. Notice the real-time **Password Strength meter** colors:
   - **Weak (Red)**: Short passwords.
   - **Moderate (Yellow)**: Letters and numbers.
   - **Good (Indigo)**: Letters, numbers, and uppercase characters.
   - **Strong (Green)**: Complete alphanumeric + symbols (length >= 10).
4. Register your account.

### 2. Protected Routes & Session persistence
1. Copy `http://localhost:5173/dashboard` and try pasting it in an Incognito window. You will automatically get redirected back to `/login` since no credentials cookie is available.
2. Log in with your registered account. 
3. Refresh the page: the state persists as the client app automatically queries `/api/auth/me` to fetch current profile details.

### 3. Forgot / Reset Password flow (Nodemailer Fallback)
1. Navigate to `http://localhost:5173/forgot-password`.
2. Submit your registered email address.
3. Check the terminal console where the Express server is running. You will see a log:
   ```
   ============= RESET PASSWORD LINK =============
   http://localhost:5173/reset-password/a78b5490...
   ================================================
   ```
4. A **Developer Testing Portal** notification box will also appear on the screen with a direct link (for easy testing without terminal inspections).
5. Click the link, set a new password, submit, and watch the app auto-log you in and redirect back to your dashboard.

### 4. Role-Based Access Control (Student vs Admin)
- By default, newly registered accounts have the `student` role.
- If a Student clicks the "Try accessing Admin Route" button or navigates to `/admin`, the `AdminRoute` react guard will block access and redirect them back to `/dashboard`.
- To test the Admin portal:
  1. Open your MongoDB GUI tool (Compass or Shell).
  2. Locate the user document in the `students` collection.
  3. Modify the `role` field from `"student"` to `"admin"`.
  4. Now click "Visit Admin Dashboard" (or go to `/admin`). You will successfully load the admin control center and see stats queried dynamically from `/api/admin/stats`.
