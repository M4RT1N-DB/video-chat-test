import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Messages } from '../dto/messages';
import { Observable } from 'rxjs';

const SERVER_URL = environment.apiurl;

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: any;

  constructor() {}

  ngOnInit(): void {}

  public initSocket(): void {
    this.socket = io(SERVER_URL);
  }

  newMessage(name: string, message: String): Messages {
    return this.socket.emit('new-message', { name, message });
  }

  loadMessages():Observable<Messages>{
    return new Observable((subs) => {
      this.socket.on('messages', (data) => {
        subs.next(data);
      });
    });
  }

  loadMessages2():Observable<Messages>{
    return new Observable((subs) => {
      this.socket.on('messages1', (data) => {
        subs.next(data);
      });
    });
  };
}
