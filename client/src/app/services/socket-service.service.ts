import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';

const SERVER_URL = environment.apiurl;
const conf = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        /* "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302" */
      ],
    },
  ],
};
let rtcPeerConnection: RTCPeerConnection;
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: any;
  dataUser: any; //roomName-creator

  userStream: MediaStream;
  peerVideoG: any;
  userVideoG: any;
  constructor() {}

  ngOnInit(): void {}

  public initSocket(): void {
    this.socket = io(SERVER_URL);
    // Triggered when a room is succesfully created.
    this.socket.on('created', (data) => {
      this.dataUser = data;
    });
    // Triggered when a room is succesfully joined.
    this.socket.on('joined', (data) => {
      this.dataUser = data;
      this.socket.emit('ready', data);
    });
    // Triggered when a peer has joined the room and ready to communicate.
    this.socket.on('ready', () => {
      if (this.dataUser.creator) {
        rtcPeerConnection = new RTCPeerConnection(conf);
        rtcPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.socket.emit(
              'candidate',
              event.candidate,
              this.dataUser.roomName
            );
          }
        };
        rtcPeerConnection.ontrack = (event) => {
          this.peerVideoG.nativeElement.srcObject = event.streams[0];
          this.peerVideoG.nativeElement.onloadedmetadata = (e) => {
            this.peerVideoG.nativeElement.play();
          };
        };
        rtcPeerConnection.addTrack(
          this.userStream.getTracks()[0],
          this.userStream
        ); //represents audio track
        rtcPeerConnection.addTrack(
          this.userStream.getTracks()[1],
          this.userStream
        ); //represents video track
        rtcPeerConnection
          .createOffer()
          .then((offer) => {
            rtcPeerConnection.setLocalDescription(offer);
            this.socket.emit('offer', offer, this.dataUser.roomName);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    // Triggered on receiving an ice candidate from the peer.
    this.socket.on('candidate', (candidate) => {
      let iceCandidate = new RTCIceCandidate(candidate);
      rtcPeerConnection.addIceCandidate(iceCandidate);
    });

    // Triggered on receiving an offer from the person who created the room.
    this.socket.on('offer', (offer) => {
      if (this.dataUser.creator === false) {
        rtcPeerConnection = new RTCPeerConnection(conf);
        rtcPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.socket.emit(
              'candidate',
              event.candidate,
              this.dataUser.roomName
            );
          }
        };
        rtcPeerConnection.ontrack = (event) => {
          this.peerVideoG.nativeElement.srcObject = event.streams[0];
          this.peerVideoG.nativeElement.onloadedmetadata = (e) => {
            this.peerVideoG.nativeElement.play();
          };
        };
        rtcPeerConnection.addTrack(
          this.userStream.getTracks()[0],
          this.userStream
        ); //represents audio track
        rtcPeerConnection.addTrack(
          this.userStream.getTracks()[1],
          this.userStream
        ); //represents video track
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection
          .createAnswer()
          .then((answer) => {
            rtcPeerConnection.setLocalDescription(answer);
            this.socket.emit('answer', answer, this.dataUser.roomName);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });

    // Triggered on receiving an answer from the person who joined the room.
    this.socket.on('answer', (answer) => {
      rtcPeerConnection.setRemoteDescription(answer);
    });

    this.socket.on('leave', () => {
      this.dataUser.creator = true; //this person is now the creator because they are the only person in the room
      if (this.peerVideoG.nativeElement.srcObject) {
        this.peerVideoG.nativeElement.srcObject.getTracks()[0].stop(); //stop receiving audio
        this.peerVideoG.nativeElement.srcObject.getTracks()[1].stop(); //stop receiving video
      }
      //safely closes the existing connection established with the peer who left
      if (rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
      }
    });
  }

  joinRoom(
    roomName: string,
    creator: boolean,
    userVideo: any,
    peerVideo: any,
    userStream: MediaStream
  ) {
    this.socket.emit('join', roomName, creator, (response: any) => {
      this.userStream = userStream;
      this.userVideoG = userVideo;
      this.peerVideoG = peerVideo;
      //response
      console.log(response);
    });
  }

  leaveRoom() {
    this.socket.emit('leave', this.dataUser.roomName);
    if (this.userVideoG.srcObject) {
      this.userVideoG.srcObject.getTracks()[0].stop();
      this.userVideoG.srcObject.getTracks()[1].stop();
    }
    if (this.peerVideoG.srcObject) {
      this.peerVideoG.srcObject.getTracks()[0].stop();
      this.peerVideoG.srcObject.getTracks()[1].stop();
    }
    if (rtcPeerConnection) {
      rtcPeerConnection.ontrack = null;
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.close();
      rtcPeerConnection = null;
    }
  }
}
