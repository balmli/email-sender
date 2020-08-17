"use strict";
const Homey = require('homey');
let nodemailer = require('nodemailer');

class EmailApp extends Homey.App {

    async onInit() {
        try {
            await this.initSettings();
            await this.initFlows();
        } catch (err) {
            this.log('onInit error', err);
        }
    }

    async initSettings() {
    }

    async initFlows() {
        new Homey.FlowCardAction('sendmail')
            .register()
            .registerRunListener(args => this.doSendEmail(args));

        new Homey.FlowCardAction('sendascii')
            .register()
            .registerRunListener(args => this.doSendAsciiEmail(args));

        new Homey.FlowCardAction('sendimage')
            .register()
            .registerRunListener(args => this.doSendImageEmail(args));

        new Homey.FlowCardAction('sendimagelink')
            .register()
            .registerRunListener(args => this.doSendImageLinkEmail(args));
    }

    getEmailSettings() {
        return {
            mail_host: Homey.ManagerSettings.get('mail_host'),
            mail_port: Homey.ManagerSettings.get('mail_port'),
            mail_secure: Homey.ManagerSettings.get('mail_secure'),
            use_credentials: Homey.ManagerSettings.get('use_credentials'),
            mail_user: Homey.ManagerSettings.get('mail_user'),
            mail_pass: Homey.ManagerSettings.get('mail_password'),
            mail_from: Homey.ManagerSettings.get('mail_from')
        }
    }

    createEmailTransporter(settings) {
        let transporter = {
            host: settings.mail_host,
            port: settings.mail_port,
            secure: settings.mail_secure,
            tls: {
                rejectUnauthorized: false
            }
        };
        if (settings.use_credentials) {
            transporter = {
                ...transporter,
                auth: {
                    user: settings.mail_user,
                    pass: settings.mail_pass
                }
            }
        }
        return nodemailer.createTransport(transporter);
    }

    createEmailAddress(to) {
        return to.indexOf(';') >= 0 ? to.split(';') : to;
    }

    createMailOptions(settings, args, html = true, attachments) {
        return {
            from: 'Homey <' + settings.mail_from + '>',
            to: this.createEmailAddress(args.mailto),
            subject: args.subject,
            text: args.body,
            html: html ? args.body : undefined,
            attachments: attachments
        };
    }

    async doSendEmail(args) {
        const settings = this.getEmailSettings();
        return new Promise((resolve, reject) => {
            const transporter = this.createEmailTransporter(settings);
            const mailOptions = this.createMailOptions(settings, args);
            this.log('doSendEmail', settings, mailOptions);
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.log('doSendEmail error', error);
                    reject(error);
                } else {
                    this.log('Message sent: ' + info.response);
                    resolve();
                }
            });
        });
    }

    async doSendAsciiEmail(args) {
        const settings = this.getEmailSettings();
        return new Promise((resolve, reject) => {
            const transporter = this.createEmailTransporter(settings);
            const mailOptions = this.createMailOptions(settings, args, false);
            this.log('doSendAsciiEmail', settings, mailOptions);
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.log('doSendAsciiEmail error', error);
                    reject(error);
                } else {
                    this.log('Message sent: ' + info.response);
                    resolve();
                }
            });
        });
    }

    async doSendImageEmail(args) {
        const settings = this.getEmailSettings();
        const imageStream = await args.droptoken.getStream();
        this.log('doSendImageEmail: image', imageStream.contentType, 'to: ', imageStream.filename, imageStream);

        return new Promise((resolve, reject) => {

            const attachments = [{
                filename: imageStream.filename,
                content: imageStream,
                contentType: imageStream.contentType
            }];

            const transporter = this.createEmailTransporter(settings);
            const mailOptions = this.createMailOptions(settings, args, false, attachments);
            this.log('doSendImageEmail', settings, mailOptions);
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.log('doSendImageEmail error', error);
                    reject(error);
                } else {
                    this.log('Message sent: ' + info.response);
                    resolve();
                }
            });
        });
    }

    async doSendImageLinkEmail(args) {
        const settings = this.getEmailSettings();

        return new Promise((resolve, reject) => {

            const attachments = [{
                filename: 'attachment.jpg',
                path: args.link,
                contentType: 'image/jpeg'
            }];

            const transporter = this.createEmailTransporter(settings);
            const mailOptions = this.createMailOptions(settings, args, false, attachments);
            this.log('doSendImageLinkEmail', settings, mailOptions);
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    this.log('doSendImageLinkEmail error', error);
                    reject(error);
                } else {
                    this.log('Message sent: ' + info.response);
                    resolve();
                }
            });
        });
    }

}

module.exports = EmailApp;