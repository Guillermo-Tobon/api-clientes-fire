import nodemailer  from 'nodemailer';

export default class NodeMailer{

  public cliente:any;

  constructor( data:any ){
    this.cliente = data;
  }

  /**
   * Método para enviar correos
   */
  public sendNodemailer = (req?:any, res?:any) =>{

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'desarrollofire1@gmail.com',
        pass: 'gwbgocliaomlimcl',
      },
    });

    const mailOptions = {
      from: '"Fire Agencia 🥳" <info@fireagencia.com>',
      to: `${this.cliente.email_cli}`,
      subject: `Feliz cumpleaños ${this.cliente.nombre_cli} ✔ <info@fireagencia.com>`,
      html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style type="text/css">
                .contMsg{
                  text-align: center;
                }
                .contMsg a img{
                  width: 65%;
                }
              </style>
            </head>
            <body>
              <div class="contMsg">
                <p>¡Hola! Hoy tienes 365 razones más para hacer que tu sueño se encienda.<br>
                    Feliz cumpleaños 🎉 te desea Fire Agencia Digital 🔥</p>
                    <a href="https://fireagencia.com/" target="_blank"><img src="https://fireagencia.com/multimedia/img/Cumpleanios_m.jpg"></a>
              </div>

            </body>
            </html>
          
          `,
    }

    transporter.sendMail( mailOptions, ( err, info ) =>{
      if (err) {
        return res.status(400).send({
          ok: false,
          msg: 'No se pudo enviar el correo.',
          error: err.message 
        })
      }

      return res.status(200).send({
        ok: true,
        msg: 'Correo enviado.',
        info
      })

    })

  }





}