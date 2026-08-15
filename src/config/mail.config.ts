import { registerAs } from '@nestjs/config';

// Accessed as config.get('mail.*')
export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  secure: process.env.MAIL_ENCRYPTION === 'true',
  user: process.env.MAIL_USERNAME,
  pass: process.env.MAIL_PASSWORD,
  from: process.env.MAIL_FROM ?? 'No Reply <no-reply@shop.com>',
  // Where the /contact form's messages land — defaults to the shop's admin inbox.
  contactTo:
    process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@shop.com',
}));
