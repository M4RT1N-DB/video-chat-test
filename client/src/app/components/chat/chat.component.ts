import { Component, OnInit } from '@angular/core';
import { SocketService } from 'src/app/services/socket-service.service';

import { Messages } from '../../dto/messages';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  message: string = '';
  name: string = '';

  dummyData;

  constructor(private socketServ: SocketService) {
    this.socketServ.initSocket();
  }

  ngOnInit(): void {
    this.socketServ.loadMessages2().subscribe((data) => {
      this.dummyData = data;
    });
  }

  send() {
    this.socketServ.newMessage(this.name, this.message);
    this.socketServ.loadMessages().subscribe((data) => {
      this.dummyData = data;
    });
  }
}
