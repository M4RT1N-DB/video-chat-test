import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

import { Message } from "./model/message.model";

export class ChatServer {
  app: express.Application = express();
  server = createServer(this.app);
  io: Server = new Server(this.server, {
    cors: {
      methods: ["GET", "POST"],
    },
  });
  port: string | number = process.env.PORT || 3000;
  //--------------------------------------------

  messages: Message[] = [];
  //--------------------------------------------

  constructor() {
    this.server.listen(this.port, () => {
      console.log(`EXPRESS - Running server on port ${this.port}`);
    });
    this.io.on("connection", (socket: Socket) => {
      console.log(`SOCKET.IO - connected client on port ${this.port}`);
      console.log(`SOCKET.IO - INFO - ${socket.id}`);
//-------------------Load Messages when components loads--------------------
      socket.emit("messages1", this.messages);
      socket.broadcast.emit("messages1", this.messages);
//--------------------------------------------------------------------------
      socket.on("new-message", (data) => {
        const message: Message = {};
        message.name = data.name;
        message.message = data.message;
        this.messages.push(message);

        socket.emit("messages", this.messages);
        socket.broadcast.emit("messages", this.messages);
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected`);
      });
    });
  }
  public getApp(): express.Application {
    return this.app;
  }
}
