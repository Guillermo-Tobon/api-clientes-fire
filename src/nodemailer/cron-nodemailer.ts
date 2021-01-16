import MySQL from '../mysql/mysql';
import NodeMailer from './config-nodemailer';

export default class CronNodeMailer{

  constructor(){}

  /**
   * Método para enviar correo de cumpleaños a los clientes
   */
  public static SendEmailCumpleanios = () =>{

    const date = new Date();
    const cumple = (date.getMonth()+1)+'-'+date.getDate(); 
    
    const query = `SELECT nombre_cli, email_cli, fechanaci_cli
                   FROM  informacion_clientes
                   WHERE estado_cli = 1
                   AND fechanaci_cli LIKE '%${cumple}'`;
    
    MySQL.ejecutarQuery(query, (err: any, result: Object[]) => {

      if (err) {
        console.log(err);
        return;

      } else {
        result.forEach((object: any) => {
          new NodeMailer(object).sendNodemailer();
        });
        console.log('Todos los correos enviados');
      }

    });


  }
}