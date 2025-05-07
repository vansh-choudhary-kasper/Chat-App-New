const { config } = require("dotenv");
const express = require("express");
const routes = require("./routes/index");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const xssClean = require("xss-clean");
const cors = require("cors");
const mediasoup = require("mediasoup");
const dotenv = config();

const OneToOneMessage = require("./models/OneToOneMessage");
const GroupMessage = require("./models/GroupMessage");
const CallRecord = require("./models/Callrecord");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const path = require("path");

const fs = require("fs");
const User = require("./models/user");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const authorization = require("./middleware/authorisation");
const routers = require("express").Router();
const app = express();

// Read SSL certificate
const privateKey = fs.readFileSync('../ssl/server.key', 'utf8');
const certificate = fs.readFileSync('../ssl/server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(mongoSanitize());
app.use(xssClean());

const https = require('https');
const httpsServer = https.createServer(credentials, app);

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", "https://chat-munc.in"],
      mediaSrc: [
        "'self'",
        "https://res.cloudinary.com",
        "https://chat-munc.in",
      ],
      imgSrc: [
        "'self'",
        "https://chat-munc.in",
        "https://res.cloudinary.com",
        "blob:",
        "data:",
      ],
      scriptSrc: ["'self'", "https://chat-munc.in"],
    },
  })
);

const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const http = require("http");
const upload = require("./middleware/multer");
const uploadToCloudinary = require("./middleware/cloudinary");
const { user } = require("./controllers/user");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const server = http.createServer(app);
const fetchLinkPreviewData = async (url) => {
  try {
    const response = await axios.get(
      `https://api.linkpreview.net/?key=${process.env.LINKPREVIEW
      }&q=${encodeURIComponent(url)}`
    );

    return response.data.image || null;
  } catch (error) {
    console.error("Error fetching link preview data:", error.message);
    return null;
  }
};


const io = require("socket.io")(httpsServer, {
  pingTimeout: 60000,
  maxHttpBufferSize: 100 * 1024 * 1024,
  cors: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const DB = process.env.DBURI.replace("<password>", process.env.DBPASSWORD);

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Invalid token"));
    }
    socket.user = decoded;
    next();
  });
});
function isYesterdayOrEarlier(dateString) {
  const givenDate = new Date(dateString);
  const now = new Date();
  givenDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return givenDate <= yesterday;
}
let worker;
let peers = {};
let rooms = {};
let transports = [];
let producers = [];
let consumers = [];
const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/vp8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
];
const createWorker = async () => {
  worker = await mediasoup.createWorker();

  worker.on("died", (error) => {
    console.log("Worker died", error);
    setTimeout(() => process.exit(1), 2000);
  });
  return worker;
};
worker = createWorker();
const voiceCallRoom = {};
const createOneToOneRoom = async (roomName, user_id) => {
  let user_ids = [];
  if (voiceCallRoom[roomName]) {
    user_ids = voiceCallRoom[roomName].user_ids;
  }
  voiceCallRoom[roomName] = {
    user_ids: [...user_ids, user_id],
  };
};
const createRoom = async (roomName, socketId, user_id) => {
  let router1;
  let peers = [];
  let user_ids = [];
  if (rooms[roomName]) {
    router1 = rooms[roomName].router;
    peers = rooms[roomName].peers;
    user_ids = rooms[roomName].user_ids;
  } else {
    router1 = await worker.createRouter({ mediaCodecs });
  }
  rooms[roomName] = {
    router: router1,
    peers: [...peers, socketId],
    user_ids: [...user_ids, user_id],
  };
  return router1;
};
const createWebRtcTransport = async (router) => {
  return new Promise(async (resolve, reject) => {
    try {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "0.0.0.0", // replace with relevant IP address
            announcedIp: `${process.env.WEBRTC_LISTEN_IP}`,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      let transport = await router.createWebRtcTransport(
        webRtcTransport_options
      );

      console.log(`New WebRTC Transport created: ${transport.id}`);

      transport.on("dtlsstatechange", (dtlsState) => {
        console.log(
          `Transport ${transport.id} DTLS state changed: ${dtlsState}`
        );
        if (dtlsState === "closed") {
          transport.close();
        }
      });

      transport.on("close", () => {
        console.log(`Transport ${transport.id} closed`);
      });

      resolve(transport);
    } catch (error) {
      console.error("Error creating WebRTC Transport:", error);
      reject(error);
    }
  });
};

io.on("connection", async (socket) => {
  const user_id = socket.handshake.query["user_id"];

  const socket_id = socket.id;
  const removeItems = (items, socketId, type) => {
    items?.forEach((item) => {
      if (item.socketId === socket.id) {
        item[type].close();
      }
    });
    items = items.filter((item) => item.socketId !== socket.id);

    return items;
  };
  socket.broadcast.emit("user_status", { user_id, status: "Online" });

  if (Boolean(user_id)) {
    await User.findByIdAndUpdate(user_id, { socket_id, status: "Online" });
  }

  socket.on("text_message", async (data) => {
    let { to, from, message, conversation_id, type, conversation } = data;

    if (conversation === "chat") {
      try {
        if (to === from) return;

        const to_user = await User.findOne({ _id: to });
        const from_user = await User.findOne({ _id: from });

        const new_message = {
          to,
          from,
          type,
          seen: [],
          text: message,
          created_at: new Date().toISOString(),
          conversation,
        };
        let chat;
        if (conversation_id === undefined) {
          let newChats;
          chat = await OneToOneMessage.findOne({
            participants: { $all: [to, from] },
          });
          if (chat) {
            if (!new_message._id) {
              new_message._id = new mongoose.Types.ObjectId();
            }
            if (type === "text") {
              chat.messages.push(new_message);
              from_user.status = "Online";

              await chat.save({});
              await from_user.save({});
            } else if (type === "link") {
              const preview = await fetchLinkPreviewData(message);
              new_message.preview = preview;
              chat.messages.push(new_message);

              from_user.status = "Online";

              await chat.save({});
              await from_user.save({});
            }

            io.to(to_user.socket_id).emit("new_message", {
              conversation_id: chat._id,
              message: {
                ...new_message,
                _id: new_message._id, // Include message_id when emitting
              },
            });
            io.to(from_user.socket_id).emit("new_message", {
              conversation_id: chat._id,
              message: {
                ...new_message,
                _id: new_message._id, // Include message_id when emitting
              },
            });
            socket.broadcast.emit("user_status", { user_id, status: "Online" });
          } else {
            if (!new_message._id) {
              new_message._id = new mongoose.Types.ObjectId();
            }

            if (type === "text") {
              const newChat = new OneToOneMessage({
                participants: [to, from],
                messages: [new_message],
              });
              from_user.status = "Online";
              const doc_id = await newChat.save();
              const chatvalue = await OneToOneMessage.findById(
                doc_id._id
              ).populate(
                "participants",
                "firstname lastname _id status socket_id profile"
              );
              const filteredPar = chatvalue.participants.filter((val) => {
                return val._id.toString() === from;
              });

              chatvalue.participants = filteredPar;

              newChats = chatvalue;
              conversation_id = doc_id._id;
              await from_user.save({});
            } else if (type === "link") {
              const preview = await fetchLinkPreviewData(message); // Use await to properly handle the async function
              new_message.preview = preview;
              const newChat = new OneToOneMessage({
                participants: [to, from],
                messages: [new_message], // Assuming you have a 'messages' array in your schema
              });
              from_user.status = "Online";

              const doc_id = await newChat.save();
              const chatvalue = await OneToOneMessage.findById(
                doc_id._id
              ).populate(
                "participants",
                "firstname lastname _id status socket_id profile"
              );

              newChats = chatvalue;
              conversation_id = doc_id._id;
              await from_user.save({});
            }

            io.to(to_user.socket_id).emit("new_message", {
              newChats,
              conversation_id,
              message: {
                ...new_message,
                _id: new_message._id, // Include message_id when emitting
              },
            });

            io.to(from_user.socket_id).emit("new_message", {
              conversation_id,
              message: {
                ...new_message,
                _id: new_message._id, // Include message_id when emitting
              },
            });
            socket.broadcast.emit("user_status", { user_id, status: "Online" });
          }
        } else {
          chat = await OneToOneMessage.findById(conversation_id);
          if (!new_message._id) {
            new_message._id = new mongoose.Types.ObjectId();
          }
          if (type === "text") {
            if (
              chat.messages.length === 0 ||
              isYesterdayOrEarlier(
                chat.messages[chat.messages.length - 1].created_at
              )
            ) {
              const dateMessage = {
                to,
                type: "date",
                from,
                created_at: new Date().toISOString(),
                conversation,
              };
              chat.messages.push(dateMessage);

              io.to(to_user.socket_id).emit("new_message", {
                conversation_id,
                message: dateMessage,
              });
              io.to(from_user.socket_id).emit("new_message", {
                conversation_id,
                message: dateMessage,
              });
            }
            chat.messages.push(new_message);
            from_user.status = "Online";

            await chat.save({});
            await from_user.save({});
          } else if (type === "link") {
            const preview = await fetchLinkPreviewData(message); // Use await to properly handle the async function
            new_message.preview = preview;
            if (
              chat.messages.length === 0 ||
              isYesterdayOrEarlier(
                chat.messages[chat.messages.length - 1].created_at
              )
            ) {
              const dateMessage = {
                to,
                type: "date",
                from,
                created_at: new Date().toISOString(),
                conversation,
              };
              chat.messages.push(dateMessage);
              io.to(to_user.socket_id).emit("new_message", {
                conversation_id,
                message: dateMessage,
              });
              io.to(from_user.socket_id).emit("new_message", {
                conversation_id,
                message: dateMessage,
              });
            }
            chat.messages.push(new_message);

            from_user.status = "Online";

            await chat.save({});
            await from_user.save({});
          }

          io.to(to_user.socket_id).emit("new_message", {
            conversation_id,
            message: new_message,
          });
          io.to(from_user.socket_id).emit("new_message", {
            conversation_id,
            message: new_message,
          });
          socket.broadcast.emit("user_status", { user_id, status: "Online" });
        }
      } catch (error) {
        console.log(error);
      }
    } else if (conversation === "group") {
      try {
        const new_message = {
          to,
          from,
          type,
          seen: "unseen",
          text: message,
          created_at: new Date().toISOString(),
          conversation,
        };
        if (!from) return;
        const from_user = await User.findOne({ _id: from });

        chat = await GroupMessage.findById(conversation_id);
        if (!new_message._id) {
          new_message._id = new mongoose.Types.ObjectId();
        }
        if (type === "text") {
          if (
            chat.messages.length === 0 ||
            isYesterdayOrEarlier(
              chat.messages[chat.messages.length - 1].created_at
            )
          ) {
            const dateMessage = {
              type: "date",
              from,
              created_at: new Date().toISOString(),
              conversation,
            };
            chat.messages.push(dateMessage);
            chat.participants.forEach(async (val) => {
              const emp = await User.findOne({ _id: val.user.toString() });

              io.to(emp?.socket_id).emit("group_message", {
                conversation_id,
                message: dateMessage,
              });
            });
          }
          chat.messages.push(new_message);
          from_user.status = "Online";

          await chat.save({});
          await from_user.save({});
        } else if (type === "link") {
          const preview = await fetchLinkPreviewData(message);
          new_message.preview = preview;
          if (
            chat.messages.length === 0 ||
            isYesterdayOrEarlier(
              chat.messages[chat.messages.length - 1].created_at
            )
          ) {
            const dateMessage = {
              type: "date",
              from,
              created_at: new Date().toISOString(),
              conversation,
            };
            chat.messages.push(dateMessage);
            chat.participants.forEach(async (val) => {
              const emp = await User.findOne({ _id: val.user.toString() });

              io.to(emp?.socket_id).emit("group_message", {
                conversation_id,
                message: new_message,
              });
            });
          }
          chat.messages.push(new_message);
          from_user.status = "Online";
          await chat.save({});
          await from_user.save({});
        }

        chat.participants.forEach(async (val) => {
          const emp = await User.findOne({ _id: val.user.toString() });

          io.to(emp?.socket_id).emit("group_message", {
            conversation_id,
            message: new_message,
          });
        });

        socket.broadcast.emit("user_status", { user_id, status: "Online" });
      } catch (error) {
        console.log(error);
      }
    }
  });
  socket.on("chat_seen", async (data) => {
    try {
      const updatedConversation = await OneToOneMessage.findOneAndUpdate(
        {
          _id: data.conversation_id,
          "messages._id": data.messageId,
        },
        { $addToSet: { "messages.$.seen": data.to } },
        { new: true }
      );
      if (!updatedConversation) {
        return;
      }
    } catch (error) { }
  });
  routers.post("/user/group", upload.single("file"), async (req, res) => {
    const { groupName, groupMember } = req.body;

    let members;
    try {
      members = JSON.parse(groupMember);
    } catch (error) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid group members format",
      });
    }

    if (!groupName || members.length < 3) {
      return res.status(400).json({
        status: "fail",
        message: "Minimum members or group name is missing",
      });
    }

    try {
      let groupProfile = null;
      if (req.file) {
        try {
          const cloudinaryRes = await uploadToCloudinary(
            req.file.path,
            "image"
          ); // Pass the file path and type
          groupProfile = cloudinaryRes.secure_url; // Get the URL of the uploaded image
        } catch (error) {
          return res.status(500).json({
            status: "error",
            message: "File upload failed",
          });
        }
      }

      const participants = members.map((userId, index) => ({
        user: mongoose.Types.ObjectId.createFromHexString(userId),
        role: index === members.length - 1 ? "admin" : "member",
      }));

      // Create the group in the database
      const group = await GroupMessage.create({
        participants,
        groupName,
        groupProfile: groupProfile ? groupProfile : null,
      });

      // Fetch populated group info for broadcasting
      const groupInfo = await GroupMessage.findById(group._id).populate(
        "participants.user",
        "firstname lastname _id status socket_id profile"
      );

      // Broadcast the new group to all participants
      groupInfo.participants.forEach(async (participant) => {
        const user = await User.findById(participant.user._id);

        // Emit the "new_group" event to the user's socket
        io.to(user?.socket_id).emit("new_group", {
          groupInfo,
        });
      });

      res.status(200).json({
        message: "Group Created",
        status: "success",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: "failed",
        message: "Server error",
      });
    }
  });
  routers.post("/user/fileMessage", upload.single("file"), async (req, res) => {
    try {
      let {
        to,
        from,
        conversation_id,
        type,
        text,
        msgId,
        loading,
        conversation,
      } = req.body;

      if (conversation === "chat") {
        const cloudinaryRes = await uploadToCloudinary(
          req.file.path,
          req.body.type
        );

        let new_message = {
          to,
          loading,
          from,
          type,
          msgId,
          conversation,
          text,
          seen: "unseen",
          created_at: Date.now(),
          file: cloudinaryRes.secure_url,
          filename:
            req.body.type === "pdf" || req.body.type === "zip"
              ? req.body.filename
              : null,
        };
        let chat;
        const to_user = await User.findById(to);
        const from_user = await User.findById(from);

        if (conversation_id === "undefined") {
          let newChats;
          chat = await OneToOneMessage.findOne({
            participants: { $all: [to, from] },
          });
          if (!new_message._id) {
            new_message._id = new mongoose.Types.ObjectId();
          }
          if (chat) {
            new_message.loading = false;
            chat.messages.push(new_message);
            from_user.status = "Online";

            await chat.save({});
            await from_user.save({});

            io.to(to_user.socket_id).emit("new_message", {
              conversation_id,
              message: new_message,
            });

            io.to(from_user.socket_id).emit("new_message", {
              conversation_id,
              message: new_message,
            });
            socket.broadcast.emit("user_status", {
              user_id: from,
              status: "Online",
            });
            res.status(200).json({ message: "file sended successfully" });
          } else {
            if (!new_message._id) {
              new_message._id = new mongoose.Types.ObjectId();
            }
            new_message.loading = false;
            const newChat = new OneToOneMessage({
              participants: [to, from],
              messages: [new_message],
            });

            from_user.status = "Online";
            const doc_id = await newChat.save();
            const chatvalue = await OneToOneMessage.findById(
              doc_id._id
            ).populate(
              "participants",
              "firstname lastname _id status socket_id profile"
            );
            const filteredPar = chatvalue.participants.filter((val) => {
              return val._id.toString() === from;
            });

            chatvalue.participants = filteredPar;
            newChats = chatvalue;
            newChats.msgId = msgId;
            conversation_id = doc_id._id;
            await from_user.save({});

            io.to(to_user.socket_id).emit("new_message", {
              newChats,
              conversation_id,
              message: new_message,
            });
            io.to(from_user.socket_id).emit("new_message", {
              newChats,
              conversation_id,
              message: new_message,
            });
            socket.broadcast.emit("user_status", { user_id, status: "Online" });
          }
        } else {
          if (!new_message._id) {
            new_message._id = new mongoose.Types.ObjectId();
          }
          chat = await OneToOneMessage.findById(conversation_id);

          new_message.loading = false;
          chat.messages.push(new_message);
          from_user.status = "Online";

          await chat.save({});
          await from_user.save({});

          io.to(to_user.socket_id).emit("new_message", {
            conversation_id,
            message: new_message,
          });

          io.to(from_user.socket_id).emit("new_message", {
            conversation_id,
            message: new_message,
          });
          socket.broadcast.emit("user_status", {
            user_id: from,
            status: "Online",
          });
        }
      } else if (conversation === "group") {
        const cloudinaryRes = await uploadToCloudinary(
          req.file.path,
          req.body.type
        );

        let new_message = {
          conversation,
          loading,
          from,
          type,
          msgId,
          text,
          seen: "unseen",
          created_at: Date.now(),
          file: cloudinaryRes.secure_url,
          filename:
            req.body.type === "pdf" || req.body.type === "zip"
              ? req.body.filename
              : null,
        };
        const from_user = await User.findById(from);
        if (!new_message._id) {
          new_message._id = new mongoose.Types.ObjectId();
        }
        chat = await GroupMessage.findById(conversation_id);

        if (
          chat.messages.length === 0 ||
          isYesterdayOrEarlier(
            chat.messages[chat.messages.length - 1].created_at
          )
        ) {
          const dateMessage = {
            type: "date",
            from,
            created_at: new Date().toISOString(),
            conversation,
          };
          chat.messages.push(dateMessage);
          new_message.loading = false;
          chat.messages.push(new_message);
          from_user.status = "Online";

          await chat.save({});
          await from_user.save({});
          chat.participants.forEach(async (val) => {
            const emp = await User.findOne({ _id: val.user.toString() });

            io.to(emp?.socket_id).emit("group_message", {
              conversation_id,
              message: new_message,
              dateMessage,
            });
          });
        } else {
          new_message.loading = false;
          chat.messages.push(new_message);
          from_user.status = "Online";

          await chat.save({});
          await from_user.save({});
          chat.participants.forEach(async (val) => {
            const emp = await User.findOne({ _id: val.user.toString() });

            io.to(emp?.socket_id).emit("group_message", {
              conversation_id,
              message: new_message,
            });
          });
        }
      }
      socket.broadcast.emit("user_status", { user_id: from, status: "Online" });
    } catch (error) {
      console.error("Error during file upload:", error.message);
      res
        .status(500)
        .json({ message: "Error uploading chunk", error: error.message });
      return;
    }
  });
  routers.get("/auth/logout", async (req, res) => {
    const { user } = req.query;

    try {
      if (!user) {
        res.status(400).json({
          status: "error",
          message: "user is required",
        });
      }

      const userDoc = await User.findByIdAndUpdate(
        { _id: user },
        { $set: { status: "Offline" } }
      );

      socket.broadcast.emit("user_status", { user_id: user, status: "Online" });

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "error",
        message: "server error",
      });
    }
  });

  async function updateMessageStatus(search, messageId, from, status) {
    const doc = await OneToOneMessage.findById(search);

    const index = doc?.messages.findIndex(
      m => m._id.equals(messageId) && m.from.equals(from)
    );

    if (index === -1) return {modifiedCount: 0};

    const fieldPath = `messages.${index}.status`;

    return OneToOneMessage.updateOne(
      { _id: search },
      { $set: { [fieldPath]: status } },
      { runValidators: true }
    );
  }

  routers.patch(
    "/user/messageStatus",
    authorization.protect,
    async (req, res) => {
      try {
        const { search, messageId } = req.query;
        const { to, from } = req.body;
        const to_user = await User.findById({ _id: to });
        const from_user = await User.findById({ _id: from });

        if (!search || search.trim() === "") {
          return res.status(400).json({
            status: "failed",
            message: "Conversation ID is required",
          });
        }

        if (!messageId || messageId.trim() === "") {
          return res.status(400).json({
            status: "failed",
            message: "Message ID is required",
          });
        }

        const result = await updateMessageStatus(search, messageId, from, "delete");
        console.log(await OneToOneMessage.findById(search));

        if (result.modifiedCount === 0) {
          return res.status(404).json({
            status: "failed",
            message: "No matching conversation or message found",
            data: [],
          });
        }
        io.to(to_user.socket_id).emit("delete_message", { search, messageId });

        io.to(from_user.socket_id).emit("delete_message", {
          search,
          messageId,
        });
        return res.status(200).json({
          status: "success",
          message: "Message status updated successfully",
          data: { search, messageId },
        });
      } catch (error) {
        console.error("Error in messageStatus:", error);
        return res.status(500).json({
          status: "failed",
          message: "Server error",
        });
      }
    }
  );

  routers.patch("/user/message",authorization.protect, async (req, res) => {
    const { search, messageId } = req.query;
    const { newText, to, from } = req.body;
    console.log("io seted");

    const to_user = await User.findById({ _id: to });
    const from_user = await User.findById({ _id: from });
  
    if (!search || search.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Search is required",
      });
    }
  
    if (!messageId || messageId.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "Message ID is required",
      });
    }
  
    console.log("new text", newText);
  
    if (!newText || newText.trim() === "") {
      return res.status(400).json({
        status: "failed",
        message: "New Text is required",
      });
    }
  
    try {
      const conversation = await OneToOneMessage.findOne({
        _id: search,
        "messages._id": messageId,
      }).populate(
        "participants",
        "firstname lastname _id status socket_id profile"
      );
  
      if (!conversation) {
        return res.status(404).json({
          status: "failed",
          message: "No Conversation found",
          data: [],
        });
      }
  
      console.log(messageId);
      const index = conversation.messages.findIndex(
        (val) => val._id.toString() === messageId
      );
      if (index === -1) return res.status(404).json({
        status: "failed",
        message: "No matching conversation or message found",
        data: [],
      });
  
      conversation.messages[index].text = newText;
      await conversation.save();

      io.to(to_user.socket_id).emit("edit_message", {
        search,
        messageId,
        newText,
      });

      io.to(from_user.socket_id).emit("edit_message", {
        search,
        messageId,
        newText,
      });
  
      res.status(200).json({
        status: "success",
        message: "Message updated successfully",
        data: { index, conversation },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Server error",
      });
    }
  });

  socket.on("join-video-room", async ({ to, roomId, from }) => {
    createOneToOneRoom(roomId, from);
    const to_user = await User.findOne({ _id: to });
    createOneToOneRoom(roomId, to);
    if (!to_user) {
      io.to(socket.id).emit("user_video_call_status", { status: "not found" });
      return;
    }
    if (to_user.status === "Offline") {
      io.to(socket.id).emit("user_video_call_status", { status: "Offline" });
      return;
    } else if (to_user.inCall === true) {
      io.to(socket.id).emit("user_video_call_status", { status: "In Call" });
      return;
    }
    const targetSocket = io.sockets.sockets.get(to_user.socket_id);
    if (targetSocket) {
      targetSocket.join(roomId);
      socket.join(roomId);

      io.to(socket.id).emit("room_video_created", {
        your: socket.id,
        id: targetSocket.id,
      });
    }
  });
  socket.on("video_call_user", ({ to, offer }) => {
    io.to(to).emit("incoming_video_call", { from: socket.id, offer });
  });
  socket.on("answer_video_call", ({ to, answer }) => {
    io.to(to).emit("video_call_answered", { from: socket.id, answer });
  });
  socket.on("video_ice_candidate", ({ to, candidate }) => {
    io.to(to).emit("video_ice_candidate", { from: socket.id, candidate });
  });
  socket.on("join-voice-room", async ({ to, roomId }) => {
    const to_user = await User.findOne({ _id: to });

    if (!to_user) {
      io.to(socket.id).emit("user_voice_call_status", { status: "not found" });
      return;
    }
    if (to_user.status === "Offline") {
      io.to(socket.id).emit("user_voice_call_status", { status: "Offline" });
      return;
    } else if (to_user.inCall === true) {
      io.to(socket.id).emit("user_voice_call_status", { status: "In Call" });
      return;
    }
    const targetSocket = io.sockets.sockets.get(to_user.socket_id);
    if (targetSocket) {
      targetSocket.join(roomId);
      socket.join(roomId);

      io.to(socket.id).emit("room_voice_created", {
        your: socket.id,
        id: targetSocket.id,
      });
    }
  });
  socket.on("voice_call_user", ({ to, offer }) => {
    io.to(to).emit("incoming_voice_call", { from: socket.id, offer });
  });
  socket.on("answer_voice_call", ({ to, answer }) => {
    io.to(to).emit("voice_call_answered", { from: socket.id, answer });
  });
  socket.on("audio_ice_candidate", ({ to, candidate }) => {
    io.to(to).emit("audio_ice_candidate", { from: socket.id, candidate });
  });

  //group video calll
  socket.on("checkGroup", async ({ chat }, callback) => {
    let userActive = 0;

    for (const val of chat) {
      const emp = await User.findOne({ _id: val });

      if (!emp) continue;
      if (emp.status === "Offline") continue;
      if (emp.inCall === true) continue;
      if (emp.socket_id !== "logout") {
        userActive++;
      }
    }

    if (userActive === 0) {
      callback({ call: false });
    } else {
      callback({ call: true });
      console.log(true);
    }
  });
  socket.on("joinGroupCall", async ({ chat, roomName, producer }, callback) => {
    // let call = await CallRecord.findOne({ roomName, status: "active" });
    // // console.log(producer);

    // if (!call) {
    //   call = new CallRecord({
    //     roomName,
    //     participants: [{ user: user_id, host: true, callStatus: "outgoing" }],
    //     status: "active",
    //   });
    //   await call.save();
    //   console.log("Call started:", call);
    // }
    // const isUserInCall = Object.values(rooms).some((room) =>
    //   room.user_ids.includes(user_id)
    // );
    // console.log(isUserInCall);
    // if (isUserInCall) {
    //   console.log("hello");
    //   io.to(socket.id).emit("group_call_failed", {
    //     status: "User already in an active call",
    //   });
    //   return;
    // }
    if (producer) {
      let userActive = [];

      for (const val of chat) {
        const emp = await User.findOne({ _id: val });

        if (!emp) continue;
        if (emp.status === "Offline" || emp.inCall === true) {
          // call.participants.push({ user: user_id, callStatus: "missed" });
          // await call.save();
        }

        if (emp.socket_id !== "logout") {
          // emp.inCall = true;
          userActive.push(emp.socket_id); // Fix: Use emp.socket_id
          await emp.save();
        }
      }

      if (userActive.length === 0) {
        io.to(socket.id).emit("group_call_failed", {
          status: "no user Active",
        });
        return;
      } else {
        userActive.forEach((val) => {
          io.to(val).emit("incoming_group_call", { roomName });
        });

        const router1 = await createRoom(roomName, socket.id, user_id);

        peers[socket.id] = {
          socket,
          roomName,
          transports: [],
          producers: [],
          consumers: [],
          peerDetails: {
            name: "",
            idAdmin: false,
          },
        };
        const rtpCapabilities = router1.rtpCapabilities;
        callback({ rtpCapabilities });
      }
    } else {
      const router1 = await createRoom(roomName, socket.id, user_id);

      peers[socket.id] = {
        socket,
        roomName,
        transports: [],
        producers: [],
        consumers: [],
        peerDetails: {
          name: "",
          idAdmin: false,
        },
      };
      const rtpCapabilities = router1.rtpCapabilities;
      callback({ rtpCapabilities });
      // const call = await CallRecord.findOne({ roomName, status: "active" });
      // if (!call) {
      //   console.log("No active call found for room:", roomName);
      //   return;
      // }

      // const existingParticipant = call.participants.find((p) =>
      //   p.user.equals(user_id)
      // );

      // if (!existingParticipant) {
      //   call.participants.push({ user: user_id, callStatus: "incoming" });
      //   await call.save();
      //   console.log(
      //     `Participant ${user_id} added to call in room: ${roomName}`
      //   );
      // } else {
      //   console.log(`User ${user_id} is already in the call.`);
      // }
    }
  });

  socket.on("call_users", async ({ chat, roomName, producer }, callback) => {
    if (producer)
      userActive.map((val) => io.to(val).emit("incoming_group_call"));
  });
  socket.on("createWebRtcTransport", async ({ consumer }, callback) => {
    const roomName = peers[socket.id].roomName;
    const router = rooms[roomName].router;

    console.log(
      `Creating WebRTC transport for ${socket.id} in room ${roomName}`
    );

    createWebRtcTransport(router).then(
      (transport) => {
        if (!transport) {
          console.error("Transport creation failed");
          return callback({ error: "Transport creation failed" });
        }

        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });

        addTransport(transport, roomName, consumer);
      },
      (error) => {
        console.log("Error creating WebRTC transport:", error);
        callback({ error: error.message });
      }
    );
  });

  const addTransport = (transport, roomName, consumer) => {
    transports = [
      ...transports,
      { socketId: socket.id, transport, roomName, consumer },
    ];

    peers[socket.id] = {
      ...peers[socket.id],
      transports: [...peers[socket.id].transports, transport.id],
    };
  };

  const addProducer = (producer, roomName) => {
    producers = [...producers, { socketId: socket.id, producer, roomName }];

    peers[socket.id] = {
      ...peers[socket.id],
      producers: [...peers[socket.id].producers, producer.id],
    };
  };

  const addConsumer = (consumer, roomName) => {
    // add the consumer to the consumers list
    consumers = [...consumers, { socketId: socket.id, consumer, roomName }];

    peers[socket.id] = {
      ...peers[socket.id],
      consumers: [...peers[socket.id].consumers, consumer.id],
    };
  };

  socket.on("getProducers", (callback) => {
    //return all producer transports
    const { roomName } = peers[socket.id];

    let producerList = [];
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socket.id &&
        producerData.roomName === roomName
      ) {
        producerList = [...producerList, producerData.producer.id];
      }
    });

    // return the producer list back to the client
    callback(producerList);
  });

  const informConsumers = (roomName, socketId, id) => {
    // A new producer just joined
    // let all consumers to consume this producer
    producers.forEach((producerData) => {
      if (
        producerData.socketId !== socketId &&
        producerData.roomName === roomName
      ) {
        const producerSocket = peers[producerData.socketId].socket;
        // use socket to send producer id to producer
        producerSocket.emit("new-producer", { producerId: id });
      }
    });
  };

  const getTransport = (socketId) => {
    const [producerTransport] = transports.filter(
      (transport) => transport.socketId === socketId && !transport.consumer
    );
    return producerTransport.transport;
  };

  // see client's socket.emit('transport-connect', ...)
  socket.on("transport-connect", ({ dtlsParameters }) => {
    getTransport(socket.id).connect({ dtlsParameters });
  });

  // see client's socket.emit('transport-produce', ...)
  socket.on(
    "transport-produce",
    async ({ kind, rtpParameters, appData }, callback) => {
      // call produce based on the prameters from the client
      const producer = await getTransport(socket.id).produce({
        kind,
        rtpParameters,
      });

      // add producer to the producers array
      const { roomName } = peers[socket.id];

      addProducer(producer, roomName);

      informConsumers(roomName, socket.id, producer.id);

      producer.on("transportclose", () => {
        console.log("transport for this producer closed ");
        producer.close();
      });

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: producers.length > 1 ? true : false,
      });
    }
  );

  // see client's socket.emit('transport-recv-connect', ...)
  socket.on(
    "transport-recv-connect",
    async ({ dtlsParameters, serverConsumerTransportId }) => {
      const consumerTransport = transports.find(
        (transportData) =>
          transportData.consumer &&
          transportData.transport.id == serverConsumerTransportId
      ).transport;
      if (!consumerTransport.connected) {
        await consumerTransport.connect({ dtlsParameters });
      } else {
        console.warn(`Transport ${consumerTransport.id} is already connected`);
      }
    }
  );

  socket.on(
    "consume",
    async (
      { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
      callback
    ) => {
      try {
        const { roomName } = peers[socket.id];
        const router = rooms[roomName].router;
        let consumerTransport = transports.find(
          (transportData) =>
            transportData.consumer &&
            transportData.transport.id == serverConsumerTransportId
        ).transport;

        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: remoteProducerId,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          const consumer = await consumerTransport.consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
          });

          consumer.on("transportclose", () => {
            console.log("transport close from consumer");
          });

          consumer.on("producerclose", () => {
            console.log("producer of consumer closed");
            socket.emit("producer-closed", { remoteProducerId });

            consumerTransport.close([]);
            transports = transports.filter(
              (transportData) =>
                transportData.transport.id !== consumerTransport.id
            );
            consumer.close();
            consumers = consumers.filter(
              (consumerData) => consumerData.consumer.id !== consumer.id
            );
          });

          addConsumer(consumer, roomName);

          // from the consumer extract the following params
          // to send back to the Client
          const params = {
            id: consumer.id,
            producerId: remoteProducerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            serverConsumerId: consumer.id,
          };

          // send the parameters to the client
          callback({ params });
        }
      } catch (error) {
        console.log(error.message);
        callback({
          params: {
            error: error,
          },
        });
      }
    }
  );

  // socket.on("leaveCall", async (data) => {
  //   console.log(user_id, data);
  //   const to_user = await User.findOne({ _id: data.to });
  //   io.to(to_user.socket_id).emit("disable_call", {
  //     from: user_id,
  //   });
  // });

  socket.on("consumer-resume", async ({ serverConsumerId }) => {
    const { consumer } = consumers.find(
      (consumerData) => consumerData.consumer.id === serverConsumerId
    );
    await consumer.resume();
  });
  socket.on("leave_call", () => {
    consumers = removeItems(consumers, socket.id, "consumer");
    producers = removeItems(producers, socket.id, "producer");
    transports = removeItems(transports, socket.id, "transport");
    if (peers[socket.id]) {
      const { roomName } = peers[socket.id];
      delete peers[socket.id];

      // remove socket from room
      rooms[roomName] = {
        router: rooms[roomName].router,
        peers: rooms[roomName].peers.filter(
          (socketId) => socketId !== socket.id
        ),
      };
    }
  });
  socket.on("disconnect", async () => {
    if (Boolean(user_id)) {
      await User.findByIdAndUpdate(user_id, {
        status: "Offline",
        inCall: false,
      });
    }
    consumers = removeItems(consumers, socket.id, "consumer");
    producers = removeItems(producers, socket.id, "producer");
    transports = removeItems(transports, socket.id, "transport");
    if (peers[socket.id]) {
      const { roomName } = peers[socket.id];
      delete peers[socket.id];

      // remove socket from room
      rooms[roomName] = {
        router: rooms[roomName].router,
        peers: rooms[roomName].peers.filter(
          (socketId) => socketId !== socket.id
        ),
      };
    }

    socket.broadcast.emit("user_status", { user_id, status: "Offline" });
    socket.disconnect(0);
  });
});

app.use("*", (req, res, next) => {
  console.log(req.originalUrl);
  next();
});

app.use("/api", routes);
app.use("/api", routers);

module.exports = { io, routers };






const port = process.env.PORT || 4000;
// server.listen(port, '0.0.0.0', () => {
//   console.log(`server connected on port ${port}`);
// });



httpsServer.listen(port, () => {
  console.log(`Express HTTPS server running on https://${process.env.WEBRTC_LISTEN_IP}:${port}`);
});

module.exports = app;
