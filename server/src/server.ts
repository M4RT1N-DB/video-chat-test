import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

export class ChatServer {
  app: express.Application = express();
  server = createServer(this.app);
  io: Server = new Server(this.server, {
    cors: {
      methods: ["GET", "POST"],
    },
  });
  port: string | number = process.env.PORT || 3000;
  //--------------------------------------
  rooms: string[] = [];
  //----------------------------------------
  constructor() {
    this.server.listen(this.port, () => {
      console.log(`EXPRESS - Running server on port ${this.port}`);
    });
    this.io.on("connection", (socket: Socket) => {
      console.log(`SOCKET.IO - connected client on port ${this.port}`);

      socket.on("join", (roomName, creator, callback) => {
        if (this.rooms.includes(roomName) === false) {
          this.rooms.push(roomName);
          socket.join(roomName);
          socket.emit("created", { roomName, creator });
          console.log("Room Created...");
        } else {
          socket.join(roomName);
          socket.emit("joined", { roomName, creator });
          console.log("Room Joined");
        }

        return callback({ status: "ok" });
      });
      //--------------Triggered when the person who joined the room is ready to comunicate
      socket.on("ready", (data) => {
        socket.broadcast.to(data.roomName).emit("ready");
      });

      socket.on("leave", function (data) {
        socket.leave(data.roomName);
        socket.broadcast.to(data.roomName).emit("leave");
      });
      //Triggered when server gets an icecandidate from a peer in the room.
      socket.on("candidate", (candidate, roomName) => {
        socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
      });
      //Triggered when server gets an offer from a peer in the room.
      socket.on("offer", (offer, data) => {
        socket.broadcast.to(data).emit("offer", offer);
      });
      //Triggered when server gets an answer from a peer in the room.
      socket.on("answer", (answer,roomName) => {
        socket.broadcast.to(roomName).emit("answer", answer);
      });

      /* socket.on("disconnect", () => {
        console.log(`User disconnected`);
      }); */
    });
  }
  public getApp(): express.Application {
    return this.app;
  }
}
