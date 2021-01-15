import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { callbackify } from "util";
import { Response } from "./model/data.model";

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

  response: Response = {
    creator: false,
    errorMessage: "",
  };
  //----------------------------------------
  constructor() {
    this.server.listen(this.port, () => {
      console.log(`EXPRESS - Running server on port ${this.port}`);
    });
    this.io.on("connection", (socket: Socket) => {
      console.log(`SOCKET.IO - connected client on port ${this.port}`);
      console.log(`SOCKET.IO - INFO - ${socket.id}`);

      socket.on("join", (roomName, creator, callback) => {
        console.log(this.rooms);
        console.log(roomName); //response Object : roomName, creator
        console.log(creator);
        if (this.rooms.includes(roomName) === false) {
          console.log(roomName);
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
        console.log("server - Ready");
        console.log(data);
        socket.broadcast.to(data.roomName).emit("ready");
      });

      socket.on("leave", function (data) {
        socket.leave(data.roomName);
        socket.broadcast.to(data.roomName).emit("leave");
      });
      //Triggered when server gets an icecandidate from a peer in the room.
      socket.on("candidate", (candidate, roomName) => {
        console.log("candidate server");
        console.log(candidate);
        console.log('roomName server:');
        console.log(roomName);
        socket.broadcast.to(roomName).emit("candidate", candidate); //Sends Candidate to the other peer in the room.
      });
      //Triggered when server gets an offer from a peer in the room.
      socket.on("offer", (offer, data) => {
        console.log("offer - server");
        console.log("data del offer");
        console.log(data);
        console.log("callback del offer");
        console.log(offer);
        socket.broadcast.to(data).emit("offer", offer);
      });
      //Triggered when server gets an answer from a peer in the room.
      socket.on("answer", (answer,roomName) => {
        console.log('answer - server');
        console.log(answer);
        console.log('roomName Answer');
        console.log(roomName);
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
