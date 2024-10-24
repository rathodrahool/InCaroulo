import { Injectable } from '@nestjs/common';
import schedule from 'node-schedule';
import admin from '@config/firebase/firebase-config';

const messaging = admin.messaging();
@Injectable()
export class NotificationService {
    async sendNotification(title: string, description: string) {
        const tokens = []; // take this token from database
        const message = {
            notification: {
                title: title,
                body: description,
            },
            tokens: tokens.map((token) => token.device_token),
        };
        await messaging.sendEachForMulticast(message);
    }
    async scheduleNotification(title: string, description: string, scheduled_at: Date) {
        schedule.scheduleJob(scheduled_at, async () => {
            await this.sendNotification(title, description);
        });
    }
}
