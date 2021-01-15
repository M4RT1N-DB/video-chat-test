import { Component, OnInit, ViewChild, ElementRef, Pipe } from '@angular/core';
import { SocketService } from 'src/app/services/socket-service.service';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  //---------------------------------------------------
  @ViewChild('roomName') roomName: ElementRef;
  @ViewChild('userVideo') userVideo: ElementRef;
  @ViewChild('peerVideo') peerVideo: ElementRef;
  @ViewChild('createRoomCheck') createRoomCheck: ElementRef;
  @ViewChild('joinRoomCheck') joinRoomCheck: ElementRef;
  @ViewChild('hideCameraV') hideCameraV: ElementRef;
  @ViewChild('leaveButtonV') leaveButtonV: ElementRef;
  @ViewChild('muteButtonV') muteButtonV: ElementRef;
  //---------------------------------------------------
  muteFlag:boolean = true;
  hideCameraFlag:boolean = false;
  showGroupButtons: boolean = true;

  roomNameSave: string = '';
  creator: boolean = false;
  rtcPeerConnection: RTCPeerConnection;
  userStream: MediaStream;
  //------------------------------
  constructor(private socketServ: SocketService) {
    this.socketServ.initSocket();
  }

  ngOnInit(): void {}

  joinRoom() {
    this.roomNameSave = this.roomName.nativeElement.value;
    if (this.roomNameSave === '' && this.valitationCheckBox()) {
      alert('Please enter the name of the room or the type of session');
    } else {
      this.onCamera();
    }
  }

  valitationCheckBox() {
    if (
      (this.createRoomCheck.nativeElement.checked === true &&
        this.joinRoomCheck.nativeElement.checked === false) ||
      (this.createRoomCheck.nativeElement.checked === false &&
        this.joinRoomCheck.nativeElement.checked === true)
    ) {
      return true;
    }
  }

  onCamera() {
    //-------------------------------------------------------------
    if (this.createRoomCheck.nativeElement.checked === true) {
      this.creator = true;
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: { width: 500, height: 500 },
        })
        .then((stream: MediaStream | null) => {
          this.userStream = stream;
          this.socketServ.joinRoom(
            this.roomNameSave,
            this.creator,
            this.userVideo,
            this.peerVideo,
            this.userStream
          );
          this.userVideo.nativeElement.srcObject = stream;
          this.userVideo.nativeElement.onloadedmetadata = (e) => {
            this.userVideo.nativeElement.play();
          };
        })
        .catch(function (err) {
          console.log('some Error: ', err);
        });
    } else {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: { width: 500, height: 500 },
        })
        .then((stream: MediaStream | null) => {
          this.userStream = stream;
          this.socketServ.joinRoom(
            this.roomNameSave,
            this.creator,
            this.userVideo,
            this.peerVideo,
            this.userStream
          );
          this.userVideo.nativeElement.srcObject = stream;
          this.userVideo.nativeElement.onloadedmetadata = (e) => {
            this.userVideo.nativeElement.play();
          };
        })
        .catch(function (err) {
          console.log('some Error: ', err);
        });
    }

    //---------------------------------------------------------------
  }

  hideCameraButton() {
    this.hideCameraFlag = !this.hideCameraFlag;
    if (this.hideCameraFlag) {
      this.userStream.getTracks()[1].enabled = false;
      this.hideCameraV.nativeElement.textContent = 'Show Camera';
    } else {
      this.userStream.getTracks()[1].enabled = true;
      this.hideCameraV.nativeElement.textContent = 'Hide Camera';
    }
  }
  leaveButton() {
    if (this.userVideo.nativeElement.srcObject) {
      this.userVideo.nativeElement.srcObject.getTracks()[0].stop();
      this.userVideo.nativeElement.srcObject.getTracks()[1].stop();
    }
    if (this.peerVideo.nativeElement.srcObject) {
      this.peerVideo.nativeElement.srcObject.getTracks()[0].stop();
      this.peerVideo.nativeElement.srcObject.getTracks()[1].stop();
    }

    if (this.rtcPeerConnection) {
      this.rtcPeerConnection.ontrack = null;
      this.rtcPeerConnection.onicecandidate = null;
      this.rtcPeerConnection.close();
      this.rtcPeerConnection = null;
    }
    this.socketServ.leaveRoom();
  }

  muteButton() {
    this.muteFlag = !this.muteFlag;
    if (this.muteFlag) {
      this.userStream.getTracks()[0].enabled = false;
      this.muteButtonV.nativeElement.textContent = 'Unmute';
    } else {
      this.userStream.getTracks()[0].enabled = true;
      this.muteButtonV.nativeElement.textContent = 'Mute';
    }
  }
}
