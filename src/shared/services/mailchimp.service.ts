import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import { error } from 'console';
import { ERROR } from '@shared/constants/messages';

@Injectable()
export class MailchimpService {
    private mailchimpApiKey: string;
    private mailchimpListId: string;
    private mailchimpDc: string;

    constructor(private readonly configService: ConfigService) {
        this.mailchimpApiKey = this.configService.get<string>('mailchimp.key');
        this.mailchimpListId = this.configService.get<string>('mailchimp.list');
        this.mailchimpDc = this.mailchimpApiKey.split('-')[1];
    }

    async addSubscriberToList(firstName: string, email: string, lastName: string): Promise<boolean> {
        const data = {
            members: [
                {
                    email_address: email,
                    status: 'subscribed',
                    merge_fields: {
                        FNAME: firstName,
                        LNAME: lastName,
                    },
                },
            ],
        };

        const jsonData = JSON.stringify(data);
        const url = `https://${this.mailchimpDc}.api.mailchimp.com/3.0/lists/${this.mailchimpListId}`;
        const options = {
            method: 'POST',
            auth: `anystring:${this.mailchimpApiKey}`, // Use any string as username
            headers: {
                'Content-Type': 'application/json',
            },
        };

        return new Promise<boolean>((resolve, reject) => {
            const request = https.request(url, options, (response) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                let responseData = '';

                response.on('data', (chunk) => {
                    responseData += chunk;
                });

                response.on('end', () => {
                    if (response.statusCode === 200 || response.statusCode === 201) {
                        resolve(true);
                    } else {
                        resolve(false);
                        throw new error('Error response from Mailchimp');
                    }
                });
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            request.on('error', (error) => {
                reject(false);
                throw new BadGatewayException(ERROR.SUBSCRIPTION_FAILURE);
            });

            request.write(jsonData);
            request.end();
        });
    }
}
