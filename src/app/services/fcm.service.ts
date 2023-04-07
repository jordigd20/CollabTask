import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  constructor(
    private platform: Platform,
    private afs: AngularFirestore,
    private storageService: StorageService
  ) {}

  initPush() {
    if (!this.platform.is('capacitor')) {
      console.warn('Push notifications not initialized. Not running on the capacitor platform');
      return;
    }

    this.registerPush();
  }

  async registerPush() {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      // Register with Apple / Google to receive push via APNS/FCM
      PushNotifications.register();
    }

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token: Token) => {
      const user = await this.storageService.get('user');
      await this.afs
        .collection('FCMTokens')
        .doc(user.id)
        .set({ idUser: user.id, token: token.value });
      console.log('Push registration success, token: ' + token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));
      }
    );

    // Method called when tapping on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );
  }
}
