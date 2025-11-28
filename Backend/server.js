import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routers/user.router.js";
import subscriptionRoutes from "./routers/subscription.router.js";
import profileRoutes from "./routers/profile.router.js";
import paymentRoutes from "./routers/payment.router.js";
import friendReqRoutes from "./routers/friendReq.router.js";
import chatRoutes from "./routers/chat.router.js";
import adminRoutes from "./routers/admin.router.js";
import Visit from "./models/visit.model.js";
import contactRoutes from "./routers/contact.router.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.set("io", io);

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/uploads", express.static("uploads"));

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/friend-requests", friendReqRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const users = {}; 
function getSocketIdForUser(userId) {
  return users[userId];
}

const onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

 
  socket.on("user-online", (userId) => {
    console.log(" User online:", userId);
    users[userId] = socket.id; 
    socket.join(`user_${userId}`);
    onlineUsers.add(userId);
    console.log(" Online users:", Array.from(onlineUsers));
    io.emit("online-users", Array.from(onlineUsers));
  });

  socket.on("join-chat", (chatId) => {
    console.log(" User joined chat room:", chatId);
    socket.join(chatId);
    console.log(" Socket rooms:", Array.from(socket.rooms));
  });

  socket.on("user-typing", (data) => {
    socket.to(data.chatId).emit("user-typing", data);
  });

  socket.on("user-stop-typing", (data) => {
    socket.to(data.chatId).emit("user-stop-typing", data);
  });

  socket.on("test-socket", (data) => {
    socket.emit("test-response", { message: "Socket is working!" });
  });

  
  socket.on("call-user", ({ to, offer, type, from }) => {
    const targetSocketId = getSocketIdForUser(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {
        from,
        offer,
        type,
      });
    } else {
      console.log("Target user not online for call:", to);
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetSocketId = getSocketIdForUser(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = getSocketIdForUser(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("call-ended", ({ to }) => {
    const targetSocketId = getSocketIdForUser(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  socket.on("call-declined", ({ to }) => {
  const targetSocketId = getSocketIdForUser(to);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-declined");
  }
});

  socket.on("disconnect", () => {
   
    for (const [userId, id] of Object.entries(users)) {
      if (id === socket.id) {
        delete users[userId];
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online-users", Array.from(onlineUsers));
    console.log(" User disconnected:", socket.id);
  });
});

app.get("/api/track-visit", async (req, res) => {
  await Visit.create({});
  res.json({ success: true });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🔌 Socket.IO server initialized");
});

export { io };
