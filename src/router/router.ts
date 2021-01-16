import { Router, Request, Response } from 'express';
import cron = require('node-cron');
import bcrypt = require('bcryptjs');

import MySQL from '../mysql/mysql';
import RouterValida from './router.validators';
import JsonWebToken from '../helpers/jwt';
import MiddlewareJWT from '../middlewares/validar-jwt';
import NodeMailer from '../nodemailer/config-nodemailer';
import CronNodeMailer from '../nodemailer/cron-nodemailer';

const routValida = new RouterValida();
const jwt = new JsonWebToken();
const middleware = new MiddlewareJWT();

const router = Router();


/*******************************************************************************************/
/*********** MÉTODOS POST ************/
/*******************************************************************************************/

/**
 * Método POST para insertar usuario administrador nuevo
 */
router.post('/api/insertUsuario', async(req: Request, res: Response ) =>{
  
  //Primero consultamos si existe el usuario
  await routValida.validarUsuario( req.body.email, (err:any, data:any) =>{

    if(data){
      return res.status(400).send({ 
        ok: false, 
        msg: 'El usuario con este correo electrónico ya está registrado'
      }); 
    }
    
    if ( err ) {
      if ( err == 'No hay registros.' ) {
        
        //Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        const password = bcrypt.hashSync( req.body.password, salt );

        const query = `
            INSERT INTO usuarios
            (nombres, apellidos, email, password, fecharegistro, estado )
            VALUES ( '${req.body.nombres}', '${req.body.apellidos}', '${req.body.email}', '${password}', CURRENT_TIMESTAMP(), 1 )`;
        
        MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
          if ( err ) {
            return res.status(400).send({
              ok: false,
              msg: 'Problema al crear el usuario.',
              err
        
            });
            
          } 
          res.status(200).send({
            ok: true,
            msg: 'Usuario registrado con éxito.',
            result
          })

        });

      } else {
        return res.status(400).send({
          ok: false,
          msg: 'Problema al consultar el usuario.',
          err
        })
      }
    }

  });
 
});



/**
 * Método POST para iniciar sesión
 */
router.post('/api/login', (req: Request, res: Response ) =>{

  const { email, password } = req.body;
  const queryUs = `SELECT * FROM usuarios WHERE email = '${email}'`;

  try {
    MySQL.ejecutarQuery( queryUs, async(err:any, result:any) =>{

      if ( err ) {
        if ( err == 'No hay registros.' ) {
          
          return res.status(400).send({
            ok: false,
            err,
            msg: 'E-mail y/o password incorrectos.'
          })
  
        } else {
          return res.status(400).send({
            ok: false,
            err,
            msg: 'Error al consultar usuario. Intente más tarde.'
          })
        }
  
      } else {
  
        const passUser = bcrypt.compareSync( password,  result[0].password);
        if ( !passUser ) {
          return res.status(400).send({
            ok: false,
            err: 'Password incorrecto.',
            msg: 'E-mail y/o password son incorrectos.'
          })
  
        } else {

          //Generar un token - JWT
          const token = await jwt.generarJWT( result[0].id, result[0].email );

          return res.status(200).send({
            ok: true,
            err,
            msg: 'Login correcto!',
            token
          })
        }
      }
  
    });

  } catch (error) {
    return res.status(500).send({
      ok: false,
      msg: 'Error inesperado en login... Revisar logs',
      error
    });
  }

});




/**
 * Método POST para insertar clientes nuevos
 */
router.post('/api/insertCliente', middleware.validarJWT, async(req: Request, res: Response ) =>{
  
  //Primero consultamos si existe el cliente
  await routValida.validarCliente( req.body.email, (err:any, data:any) =>{

    if(data){
      return res.status(400).send({ 
        ok: false, 
        msg: 'El cliente con este correo electrónico ya está registrado.'
      }); 
    }
    
    if ( err ) {
      if ( err == 'No hay registros.' ) {

        const query = `
            INSERT INTO informacion_clientes
            (nombre_cli, email_cli, telefono_cli, fechanaci_cli, compania_cli, descripcion_cli, estado_cli, fechareg_cli )
            VALUES ( '${req.body.nombre}', '${req.body.email}', '${req.body.telefono}', '${req.body.fechanaci}', '${req.body.compania}', '${req.body.descripcion}', 1, CURRENT_TIMESTAMP() )`;
        
        MySQL.ejecutarQuery( query, (err:any, result: Object[]) =>{
          if ( err ) {
            return res.status(400).send({
              ok: false,
              msg: 'Problema al crear el cliente.',
              err
        
            });
            
          } 
          res.status(200).send({
            ok: true,
            msg: 'Cliente registrado con éxito.',
            result
          })

        });

      } else {
        return res.status(400).send({
          ok: false,
          msg: 'Problema al consultar el cliente.',
          err
        })
      }
    }

  });
 
});



/**
 * Método POST para actualizar cliente por id
 */
router.put('/api/updateCliente', middleware.validarJWT, (req: Request, res: Response ) =>{
  
  const query = `
                UPDATE informacion_clientes
                SET nombre_cli = '${req.body.nombre}', email_cli = '${req.body.email}', telefono_cli = '${req.body.telefono}', fechanaci_cli = '${req.body.fechanaci}', compania_cli = '${req.body.compania}', descripcion_cli = '${req.body.descripcion}', estado_cli = ${req.body.estado}
                WHERE id_cli = ${req.body.id} `;

  MySQL.ejecutarQuery( query, (err:any, result:any) =>{
    
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } 

    if ( result.affectedRows == 0 ) {

      return res.status(400).send({
        ok: false,
        msg: 'No es posible actualizar el cliente. Verifica los datos.',
        error: err
      });
      
    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Cliente actualizado con éxito.',
        result
      });
    }


  });
  
});





/*******************************************************************************************/
/*********** MÉTODOS GET ************/
/*******************************************************************************************/

/**
 * Método GET para validar en token de seguridad y obtiene el usuario
 */
router.get('/api/loginrenew', middleware.validarJWT, ( req: Request, res: Response  ) =>{

  const token = req.header( 'x-token' );

  const query = `
                SELECT * 
                FROM usuarios 
                WHERE id = ${middleware.user.id} AND email = '${middleware.user.email}'`;
  
  MySQL.ejecutarQuery( query, (err:any, usuario: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      return res.status(200).send({
        ok: true,
        msg: 'Usuario valido.',
        token,
        usuario
      })
    }
  })

});



/**
 *Método GET que obtiene todos los usuarios administradores
 */
router.get('/api/usuarios', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = `SELECT * FROM usuarios`;

  MySQL.ejecutarQuery( query, (err:any, usuarios: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        usuarios
      })
    }
  })

});



/**
 *Método GET que obtiene todos los clientes
 */
router.get('/api/clientes', middleware.validarJWT, ( req: Request, res: Response ) =>{

  const query = `SELECT * FROM informacion_clientes`;

  MySQL.ejecutarQuery( query, (err:any, clientes: Object[]) =>{
    if ( err ) {
      return res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        clientes
      })
    }
  })

});





router.get('/api/email', async( req: Request, res: Response ) =>{

  //await NodeMailer.sendNodemailer(req, res)

});





/**
 *Método GET que obtiene usuario por id
 */
router.get('/api/usuario/:id', ( req: Request, res: Response ) =>{

  const escapeId = MySQL.instance.cnn.escape(req.params.id);

  const query = `
                SELECT * 
                FROM usuarios 
                WHERE num_identifica_us = ${escapeId}`;

  MySQL.ejecutarQuery( query, (err:any, usuario: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        usuario: usuario[0]
      })
    }
  })

});



/**
 * Método GET que obtiene la orientación según el filtro
 */
router.get('/orientacion/:idVio/:idAgre', (req: Request, res: Response ) =>{
  const escIdVio = MySQL.instance.cnn.escape(req.params.idVio);
  const escIdAgre = MySQL.instance.cnn.escape(req.params.idAgre);

  const query = `
                SELECT T1.tipo_vio AS tipoViolencia, T2.tipo_agre AS tipoAgresor,  T3.titulo_ori AS titulo, T3.texto_ori AS texto
                FROM info_orientacion AS T3
                INNER JOIN violencia AS T1 ON T1.id_vio = T3.id_violencia_ori
                INNER JOIN agresor AS T2 ON T2.id_agre = T3.id_agresor_ori
                WHERE id_violencia_ori = ${escIdVio} AND id_agresor_ori = ${escIdAgre}`;

  MySQL.ejecutarQuery(query, (err:any, orientacion: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        orientacion
      })
    }
  });

});




/**
 * Método GET que obtiene las entidades por ID
 */
router.get('/entidades/:idEnti', (req: Request, res: Response ) =>{
  const escIdEnti = MySQL.instance.cnn.escape(req.params.idEnti);

  const query = `
                SELECT *
                FROM entidades_manizales
                WHERE cod_enti = ${escIdEnti}`;

  MySQL.ejecutarQuery(query, (err:any, entidades: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        entidades
      })
    }
  });

});



/**
 * Método GET que obtiene los artículos de información por orden ascendente
 */
router.get('/informacion', (req: Request, res: Response ) =>{

  const query = `SELECT * FROM informacion ORDER BY fecha_info DESC`;

  MySQL.ejecutarQuery( query, (err:any, informacion: Object[]) =>{
    if ( err ) {
      res.status(400).send({
        ok: false,
        error: err
      });

    } else {
      res.status(200).send({
        ok: true,
        informacion
      })
    }
  })

})




//========================================================================================
/**
 * Método que mantiene la conexión de MySQL
 */
cron.schedule('*/3 * * * *', () =>{
  const hora = new Date().getTime();
  MySQL.ejecutarQuery('SELECT 1', (err:any, result:any) =>{
    if ( err ) {
      throw new Error("Error conexión");
    } else {
      console.log(`Conexión constante!! - ${hora}`);
    }
  });
});

/**
 * Método cron programado para enviar 
 * correo de cumpleaños a los clientes. 
 */
cron.schedule('00 09 * * *', () =>{
  CronNodeMailer.SendEmailCumpleanios();
})






export default router;