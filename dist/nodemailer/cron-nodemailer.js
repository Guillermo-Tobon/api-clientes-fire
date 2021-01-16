"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("../mysql/mysql"));
const config_nodemailer_1 = __importDefault(require("./config-nodemailer"));
class CronNodeMailer {
    constructor() { }
}
exports.default = CronNodeMailer;
/**
 * Método para enviar correo de cumpleaños a los clientes
 */
CronNodeMailer.SendEmailCumpleanios = () => {
    const date = new Date();
    const cumple = (date.getMonth() + 1) + '-' + date.getDate();
    const query = `SELECT nombre_cli, email_cli, fechanaci_cli
                   FROM  informacion_clientes
                   WHERE estado_cli = 1
                   AND fechanaci_cli LIKE '%${cumple}'`;
    mysql_1.default.ejecutarQuery(query, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        else {
            result.forEach((object) => {
                new config_nodemailer_1.default(object).sendNodemailer();
            });
            console.log('Todos los correos enviados');
        }
    });
};
