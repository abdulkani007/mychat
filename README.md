# MyChat - Professional Real-Time Chat Application

A modern, WhatsApp-inspired real-time chat application built with React.js, Node.js, Socket.IO, and MongoDB.

## 🚀 Features

### Authentication
- **Google OAuth Login** - Secure Firebase authentication
- **Email/Password Login** - Accepts any credentials (demo mode)
- **Automatic Session Management** - Persistent login state

### Real-Time Chat
- **Instant Messaging** - Real-time text messages
- **Media Sharing** - Send images, videos, and files
- **Voice Messages** - Record and send audio messages
- **Message Status** - Sent, Delivered, Seen indicators (WhatsApp-style)
- **Typing Indicators** - See when someone is typing
- **Online Status** - Real-time user presence

### Modern UI/UX
- **WhatsApp-Inspired Design** - Clean, professional interface
- **Responsive Layout** - Works on desktop and mobile
- **Smooth Animations** - Message transitions and interactions
- **Dark/Light Theme Support** - Modern color scheme

## 🛠 Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Socket.IO Client** - Real-time communication
- **Firebase Auth** - Authentication service
- **Axios** - HTTP client
- **CSS3** - Modern styling with animations

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time WebSocket communication
- **MongoDB** - Database with Mongoose ODM
- **Multer** - File upload handling
- **Firebase Admin** - Server-side authentication

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **Firebase Project** with Authentication enabled
- **Modern Web Browser** with microphone access for voice messages

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mychat
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `serviceAccountKey.json` file in the backend directory with your Firebase Admin SDK credentials:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-client-email",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Update `src/firebase.js` with your Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 4. Database Setup
Make sure MongoDB is running on `mongodb://127.0.0.1:27017/mychatDB`

Or update the connection string in `backend/server.js`:
```javascript
mongoose.connect("your-mongodb-connection-string")
```

## 🚀 Running the Application

### 1. Start the Backend Server
```bash
cd backend
npm start
```
Server will run on `http://localhost:4000`

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
Application will be available at `http://localhost:5173`

## 📱 Usage

### Login Options
1. **Google Login** - Click "Continue with Google" for secure authentication
2. **Email Login** - Click "Sign in with Email" and enter any email/password combination

### Chat Features
- **Send Messages** - Type and press Enter or click send button
- **Send Media** - Click the attachment button to upload images/videos
- **Voice Messages** - Hold the microphone button to record voice messages
- **Message Actions** - Right-click messages for edit/delete options (your messages only)

### Real-Time Features
- See typing indicators when others are typing
- Message status updates (sent ✓, delivered ✓✓, seen ✓✓)
- Online/offline user status
- Instant message delivery

## 🏗 Project Structure

```
mychat/
├── backend/
│   ├── uploads/          # File storage directory
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   └── serviceAccountKey.json  # Firebase admin credentials
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── firebase.js   # Firebase configuration
│   │   ├── App.jsx       # Main app component
│   │   ├── Chat.jsx      # Chat interface
│   │   ├── Login.jsx     # Authentication component
│   │   └── Chat.css      # Styling
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
└── README.md
```

## 🔒 Security Features

- **Firebase Authentication** - Secure Google OAuth
- **Token Verification** - Server-side authentication validation
- **Input Sanitization** - Protection against XSS attacks
- **File Type Validation** - Secure file upload handling
- **CORS Configuration** - Proper cross-origin resource sharing

## 🌟 Advanced Features

### Message Status System
- **Sent (✓)** - Message sent to server
- **Delivered (✓✓)** - Message delivered to recipient
- **Seen (✓✓ blue)** - Message read by recipient

### Real-Time Indicators
- **Typing Status** - "User is typing..." indicator
- **Online Presence** - Green dot for online users
- **Last Seen** - When user was last active

### Media Support
- **Images** - JPEG, PNG, GIF, WebP
- **Videos** - MP4, WebM, AVI
- **Audio** - MP3, WAV, OGG, WebM
- **Voice Messages** - Real-time recording and playback

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables for MongoDB connection
2. Upload Firebase service account key securely
3. Configure CORS for your frontend domain

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Update API endpoints to your backend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running locally
- Check connection string in `server.js`

**Firebase Authentication Error**
- Verify Firebase configuration in `firebase.js`
- Check Firebase project settings

**File Upload Issues**
- Ensure `uploads/` directory exists in backend
- Check file size limits (50MB default)

**Voice Recording Not Working**
- Grant microphone permissions in browser
- Use HTTPS in production for microphone access

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the code comments for implementation details

---

**Built with ❤️ for modern real-time communication**