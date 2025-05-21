const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Hibás JSON formátum' }),
    };
  }

  const { name, company, email, phone, note } = data;

  if (!name || !company || !email || !note) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Kötelező mező hiányzik (név, cég, email vagy üzenet)' }),
    };
  }

  const msg = {
    to: 'info@brandzone.ro',
    from: 'info@brandzone.ro', // Ezt hitelesíteni kell a SendGrid fiókodban!
    subject: 'Új árajánlat kérés érkezett',
    text: `
Név: ${name}
Cég: ${company}
Email: ${email}
Telefon: ${phone || '-'}
Üzenet:
${note}
    `,
  };

  try {
    await sgMail.send(msg);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Sikeresen elküldtük az árajánlatkérést!' }),
    };
  } catch (error) {
    console.error('SendGrid hiba:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Hiba történt az üzenet küldésekor.' }),
    };
  }
};