const { Server } = require("socket.io");
const cookie = require("cookie")
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service")
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service")


function initSocketServer(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "https://luna-virtual-assistance.vercel.app"],
            allowedHeaders: [ "Content-Type", "Authorization" ],
            credentials: true
        }
    })

    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        const bearerToken = socket.handshake.auth?.token;
        const token = bearerToken || cookies.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid token"));
        }
    })

    io.on("connection", (socket) => {
        socket.on("ai-message", async (messagePayload) => {
            
            const createMsgPromise = messageModel.create({
                chat: messagePayload.chat,
                user: socket.user._id,
                content: messagePayload.content,
                role: "user"
            });
            const vectors = await aiService.generateVector(messagePayload.content).catch(() => null);

            
            const historyPromise = messageModel
                .find({ chat: messagePayload.chat })
                .sort({ createdAt: -1 })
                .limit(12)
                .lean()
                .then((messages) => messages.reverse());

            const memoryPromise = (async () => {
                if (!vectors) return [];
                try {
                    const res = await Promise.race([
                        queryMemory({
                            queryVector: vectors,
                            limit: 3,
                            metadata: { user: socket.user._id },
                        }),
                        new Promise((resolve) => setTimeout(() => resolve([]), 1500)),
                    ]);
                    return res || [];
                } catch (_) {
                    return [];
                }
            })();

            const [chatHistory, memory, savedMessage] = await Promise.all([
                historyPromise,
                memoryPromise,
                createMsgPromise,
            ]);

           
            const stm = chatHistory.map((item) => ({
                role: item.role,
                parts: [{ text: item.content }],
            }));

            const memoryText = (memory || [])
                .map((item) => item?.metadata?.text)
                .filter(Boolean)
                .join("\n");

            const ltm = memoryText
                ? [
                      {
                          role: "user",
                          parts: [
                              {
                                  text: `these are some previous messages from the chat, use them to generate a response\n\n${memoryText}`,
                              },
                          ],
                      },
                  ]
                : [];

            
            const response = await aiService.generateResponse([...ltm, ...stm]);

            socket.emit("ai-response", {
                content: response,
                chat: messagePayload.chat,
            });

           
            const persist = async () => {
                try {
                   
                    if (vectors && savedMessage?._id) {
                        await createMemory({
                            vectors,
                            messageId: savedMessage._id,
                            metadata: {
                                chat: messagePayload.chat,
                                user: socket.user._id,
                                text: messagePayload.content,
                            },
                        });
                    }

                    
                    const responseMessage = await messageModel.create({
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        content: response,
                        role: "model",
                    });
                    const responseVectors = await aiService.generateVector(response).catch(() => null);
                    if (responseVectors) {
                        await createMemory({
                            vectors: responseVectors,
                            messageId: responseMessage._id,
                            metadata: {
                                chat: messagePayload.chat,
                                user: socket.user._id,
                                text: response,
                            },
                        });
                    }
                } catch (e) {
                    console.error("[socket.persist] error:", e?.message || e);
                }
            };

            persist();
        });
    });
}


module.exports = initSocketServer;