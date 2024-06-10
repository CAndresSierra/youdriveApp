import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerservice: MailerService) {}
  async sendEmail(user, template: string) {
    if (template === 'welcome') {
      try {
        await this.mailerservice.sendMail({
          to: user.email,
          subject: 'You Drive. Alquila Autos Facilmente',
          template: 'welcome',
          context: {
            username: user.name,
          },
          attachments: [
            {
              filename: 'logo.png',
              path: __dirname + '../../../../frontend/public/logo.png',
              cid: 'imagename',
            },
          ],
        });
        return { message: 'Correo enviado exitosamente' };
      } catch (error) {
        console.error(error);
        throw new BadRequestException(
          'El correo no pudo ser enviado exitosamente',
        );
      }
    } else if (template === 'offer') {
      try {
        await this.mailerservice.sendMail({
          to: user.email,
          subject: 'You Drive. Alquila Autos Facilmente',
          template: 'offer',
          context: {
            username: user.name,
          },
          attachments: [
            {
              filename: 'logo.png',
              path: __dirname + '../../../../frontend/public/logo.png',
              cid: 'imagename',
            },
          ],
        });
        return { message: 'Correo enviado exitosamente' };
      } catch (error) {
        console.error(error);
        throw new BadRequestException(
          'El correo no pudo ser enviado exitosamente',
        );
      }
    } else {
      const posts = user.post?.length
        ? user.post.map((post) => ({
            title: post.title,
            description: post.description,
          }))
        : [{ title: '', description: 'Aún no has publicado nada' }];

      const rentals = user.rentals?.length
        ? user.rentals.map((rentals) => ({
            rentalStartDate: rentals.rentalStartDate,
            rentalEndDate: rentals.rentalEndDate,
          }))
        : [{ rentalStartDate: 'Aún no has alquilado nada', rentalEndDate: '' }];

      try {
        await this.mailerservice.sendMail({
          to: user.email,
          subject: 'You Drive. Alquila Autos Facilmente',
          template: 'weekly',
          context: {
            username: user.name,
            posts: posts,
            rentals: rentals,
          },
          attachments: [
            {
              filename: 'logo.png',
              path: __dirname + '../../../../frontend/public/logo.png',
              cid: 'imagename',
            },
            {
              filename: 'offer.png',
              path: __dirname + '../../../../frontend/public/bestpriceform.png',
              cid: 'weeklyoffer',
            },
          ],
        });
        return { message: 'Correo enviado exitosamente' };
      } catch (error) {
        console.error(error);
        throw new BadRequestException(
          'El correo no pudo ser enviado exitosamente',
        );
      }
    }
  }
}
