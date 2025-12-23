import colors from "colors";
import { Server } from "socket.io";
import { logger } from "../shared/logger";
import { jwtHelper } from "./jwtHelper";
import { StreamChat } from "../app/modules/stream/streamChat.model";
import colors from "colors";

const socket = (io: Server) => {
  io.on("connection", (socket) => {
    logger.info(colors.blue("A user connected"));

    // Attempt to resolve user from auth token (optional)
    let user: { id?: string; email?: string; role?: string } = {};
    try {
      const token =
        (socket.handshake.auth as any)?.token ||
        (socket.handshake.query as any)?.token;
      if (typeof token === "string" && token) {
        const decoded: any = jwtHelper.verifyAccessToken(token);
        user = { id: decoded.id, email: decoded.email, role: decoded.role };
      }
    } catch (e) {
      // ignore invalid tokens for public viewing
    }

    // Join a stream's chat room
    socket.on("chat:join", ({ streamId }: { streamId: string }) => {
      if (!streamId) return;
      const room = `stream:${streamId}`;
      socket.join(room);
      io.to(room).emit("chat:system", { type: "JOIN", streamId });
    });

    // Send chat message (requires authenticated user)
    socket.on(
      "chat:message",
      async ({ streamId, message }: { streamId: string; message: string }) => {
        if (!user?.id || !streamId || !message) return;
        const saved = await StreamChat.create({
          streamId,
          userId: user.id,
          message: String(message).slice(0, 500),
          messageType: "TEXT",
        });
        const populated = await StreamChat.findById(saved._id)
          .populate("userId", "username image")
          .lean();
        io.to(`stream:${streamId}`).emit("chat:new", populated);
      }
    );

    socket.on("chat:leave", ({ streamId }: { streamId: string }) => {
      if (!streamId) return;
      socket.leave(`stream:${streamId}`);
    });

    //disconnect
    socket.on("disconnect", () => {
      logger.info(colors.red("A user disconnect"));
    });
  });
};

export const socketHelper = { socket };
