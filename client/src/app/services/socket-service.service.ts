import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';

const SERVER_URL = environment.apiurl;
const conf = {
  iceServers: [
    {
      urls: [
        /* "stun:stun.sipgate.net:3478", */
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
  peerVideoG;
  userVideoG;
  offerG;
  constructor() {}

  ngOnInit(): void {}

  public initSocket(): void {
    this.socket = io(SERVER_URL);
    // Triggered when a room is succesfully created.
    this.socket.on('created', (data) => {
      this.dataUser = data;
      console.log('se creo la sala');
      console.log(this.dataUser);
    });
    // Triggered when a room is succesfully joined.
    this.socket.on('joined', (data) => {
      this.dataUser = data;
      console.log(data);
      console.log(this.dataUser);
      console.log('se unio a una sala');
      this.socket.emit('ready', data);
    });
    // Triggered when a peer has joined the room and ready to communicate.
    this.socket.on('ready', () => {
      console.log('ready - frontend');
      if (this.dataUser.creator) {
        console.log('se levanto el ready - esperando offer');
        rtcPeerConnection = new RTCPeerConnection(conf);
        rtcPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(event.candidate);
            this.socket.emit(
              'candidate',
              event.candidate,
              this.dataUser.roomName
            );
          }
        };
        rtcPeerConnection.ontrack = (event) => {
          console.log('ready - ontrack Function');
          console.log(this.peerVideoG);
          //---------------se reempl<o peerVideoG por userVideoG
          this.peerVideoG.nativeElement.srcObject = event.streams[0];
          this.peerVideoG.nativeElement.onloadedmetadata = (e) => {
            this.peerVideoG.nativeElement.play();
          };
        };
        console.log('ready client- getTracks');
        console.log(this.userStream);
        console.log(this.userStream.getTracks());
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
            console.log('deberia emitir el offer');
            console.log(offer);
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
      console.log('esto viene de offer');
      console.log(offer);
      console.log(this.dataUser.creator);
      if (this.dataUser.creator === false) {
        rtcPeerConnection = new RTCPeerConnection(conf);
        rtcPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(event.candidate);
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
            console.log('el cliente manda el answer');
            console.log(answer);
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

    this.socket.on('leave', ()=>{
      this.dataUser.creator = true;//this person is now the creator because they are the only person in the room
      if (this.peerVideoG.nativeElement.srcObject) {
          this.peerVideoG.nativeElement.srcObject.getTracks()[0].stop();//stop receiving audio
          this.peerVideoG.nativeElement.srcObject.getTracks()[1].stop();//stop receiving video
      }
      //safely closes the existing connection established with the peer who left
      if (rtcPeerConnection) {
          rtcPeerConnection.ontrack = null;
          rtcPeerConnection.onicecandidate = null;
          rtcPeerConnection.close();
          rtcPeerConnection = null;
      }
  })
  }

  joinRoom(
    roomName: string,
    creator: boolean,
    userVideo: any,
    peerVideo: any,
    userStream: MediaStream
  ) {
    console.log('deberia imprimir el peerVideo');
    console.log(userVideo);
    console.log(userStream);
    this.socket.emit('join', roomName, creator, (response: any) => {
      this.userStream = userStream;
      this.userVideoG = userVideo;
      this.peerVideoG = peerVideo;
      console.log(response.status);
      console.log(this.userStream);
      console.log(this.userVideoG);
      console.log(this.peerVideoG);
    });
  }
  //FUNCTIONS
  // Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.
  OnIceCandidateFunction(event) {
    console.log('Candidate');
    console.log(event);
    if (event.candidate) {
      this.socket.emit('candidate', event.candidate, this.dataUser.roomName);
    }
  }
  // Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
  OnTrackFunction(event) {
    this.peerVideoG.nativeElement.srcObject = event.streams[0];
    this.peerVideoG.nativeElement.onloadedmetadata = (e) => {
      this.peerVideoG.nativeElement.play();
    };
  }
  leaveRoom() {
    this.socket.emit('leave', this.dataUser.roomName);
    if (this.userVideoG.srcObject) {
      /* userVideo.srcObject.getTracks().forEach(track => {
          track.stop();
      }); */
      this.userVideoG.srcObject.getTracks()[0].stop();
      this.userVideoG.srcObject.getTracks()[1].stop();
    }
    if (this.peerVideoG.srcObject) {
      /* peerVideo.srcObject.getTracks().forEach(track => {
        track.stop();
    }); */
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
