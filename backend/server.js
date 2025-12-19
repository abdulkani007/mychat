import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";
import admin from "firebase-admin";
import fs from "fs";
import multer from "multer";
import path from "path";


const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


mongoose
  .connect("mongodb://127.0.0.1:27017/mychatDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isTyping: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);


const messageSchema = new mongoose.Schema(
  {
    text: String,
    senderId: { type: String, required: true },
    senderName: String,
    receiverId: String,
    type: {
      type: String,
      default: "text",
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    seenBy: [{
      userId: String,
      seenAt: { type: Date, default: Date.now }
    }],
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    deletedFor: [String]
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);


const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));



app.get("/api/messages", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: 1 });
    res.json(msgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, { uid: 1, email: 1, displayName: 1, photoURL: 1, isOnline: 1, lastSeen: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const fakeUser = {
    uid: `fake_${Date.now()}`,
    email,
    displayName: email.split('@')[0],
    photoURL: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=00a884&color=fff`,
    isFakeUser: true
  };

  res.json({ user: fakeUser, token: `fake_token_${fakeUser.uid}` });
});

app.post("/api/logout", async (req, res) => {
  try {
    const { uid } = req.body;
    if (uid) {
      await User.findOneAndUpdate(
        { uid },
        { isOnline: false, lastSeen: new Date() }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|avi|mp3|wav|ogg|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let messageType = "file";
    if (req.file.mimetype.startsWith("image")) messageType = "image";
    else if (req.file.mimetype.startsWith("video")) messageType = "video";
    else if (req.file.mimetype.startsWith("audio")) messageType = "voice";

    const msg = await Message.create({
      text: req.body.caption || req.file.originalname,
      senderId: req.body.senderId,
      senderName: req.body.senderName,
      type: messageType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      status: "sent"
    });

    
    msg.status = "delivered";
    await msg.save();

    io.emit("receive_message", msg);
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});


const verifyToken = async (token) => {
  try {
    if (token.startsWith('fake_token_')) {
      const uid = token.replace('fake_token_', '');
      return { 
        uid, 
        email: `fake_${uid}@example.com`,
        name: `User${uid.slice(-4)}`,
        picture: `https://ui-avatars.com/api/?name=User${uid.slice(-4)}&background=00a884&color=fff`,
        isFakeUser: true 
      };
    }
    
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
};

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const user = await verifyToken(token);

  if (!user) return next(new Error("Unauthorized"));
  socket.user = user;
  next();
});


const connectedUsers = new Map();

io.on("connection", async (socket) => {
  console.log("✅ User connected:", socket.user.uid);
  
  connectedUsers.set(socket.user.uid, socket.id);
  
  await User.findOneAndUpdate(
    { uid: socket.user.uid },
    { 
      uid: socket.user.uid,
      email: socket.user.email || `fake_${socket.user.uid}@example.com`,
      displayName: socket.user.name || socket.user.email?.split('@')[0] || `User${socket.user.uid.slice(-4)}`,
      photoURL: socket.user.picture || `https://ui-avatars.com/api/?name=${socket.user.uid.slice(-4)}&background=00a884&color=fff`,
      isOnline: true,
      lastSeen: new Date()
    },
    { upsert: true, new: true }
  );
  
  socket.broadcast.emit("user_online", { userId: socket.user.uid, isOnline: true });

  socket.on("send_message", async (data) => {
    try {
      const messageText = typeof data === 'string' ? data : data.text;
      if (!messageText || !messageText.trim()) {
        return socket.emit("error", { message: "Message cannot be empty" });
      }

      const msg = await Message.create({
        text: messageText.trim(),
        senderId: socket.user.uid,
        senderName: socket.user.name || socket.user.email?.split('@')[0] || `User${socket.user.uid.slice(-4)}`,
        type: "text",
        status: "delivered"
      });

      
      io.emit("receive_message", msg);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("message_seen", async (messageId) => {
    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { 
          status: "seen",
          $addToSet: { 
            seenBy: { 
              userId: socket.user.uid, 
              seenAt: new Date() 
            } 
          }
        },
        { new: true }
      );
      
      if (msg) {
        io.emit("message_status_updated", { messageId, status: "seen", userId: socket.user.uid });
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });

  socket.on("typing_start", async () => {
    try {
      await User.findOneAndUpdate(
        { uid: socket.user.uid },
        { isTyping: true }
      );
      socket.broadcast.emit("user_typing", { userId: socket.user.uid, isTyping: true });
    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on("typing_stop", async () => {
    try {
      await User.findOneAndUpdate(
        { uid: socket.user.uid },
        { isTyping: false }
      );
      socket.broadcast.emit("user_typing", { userId: socket.user.uid, isTyping: false });
    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });

  socket.on("edit_message", async ({ id, text }) => {
    try {
      if (!text || !text.trim()) {
        return socket.emit("error", { message: "Message cannot be empty" });
      }

      const msg = await Message.findOneAndUpdate(
        { _id: id, senderId: socket.user.uid },
        { 
          text: text.trim(), 
          isEdited: true, 
          editedAt: new Date() 
        },
        { new: true }
      );

      if (msg) {
        // Broadcast to ALL clients for consistency
        io.emit("message_edited", msg);
      } else {
        socket.emit("error", { message: "Message not found or unauthorized" });
      }
    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  socket.on("delete_message", async ({ id, deleteType }) => {
    try {
      const msg = await Message.findOne({ _id: id, senderId: socket.user.uid });
      
      if (!msg) {
        return socket.emit("error", { message: "Message not found or unauthorized" });
      }

      if (deleteType === 'everyone') {
        await Message.findByIdAndDelete(id);
        // Broadcast to ALL clients
        io.emit("message_deleted", { id, deleteType: 'everyone' });
      } else {
        // Delete for me only - mark as deleted for this user
        await Message.findByIdAndUpdate(id, {
          $addToSet: { deletedFor: socket.user.uid }
        });
        // Only send to the requesting client
        socket.emit("message_deleted", { id, deleteType: 'me' });
      }
    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.user.uid);
    
    try {
      connectedUsers.delete(socket.user.uid);
      
      await User.findOneAndUpdate(
        { uid: socket.user.uid },
        { 
          isOnline: false, 
          isTyping: false,
          lastSeen: new Date() 
        }
      );
      
      socket.broadcast.emit("user_online", { userId: socket.user.uid, isOnline: false });
      socket.broadcast.emit("user_typing", { userId: socket.user.uid, isTyping: false });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// ---------------- ERROR HANDLING ----------------
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(4000, () => {
  console.log("🚀 Professional Chat Server Running on Port 4000");
  console.log("📱 Features: Real-time messaging, File sharing, Voice messages, Typing indicators");
});
