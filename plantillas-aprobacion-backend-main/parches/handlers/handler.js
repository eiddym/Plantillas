const _ = require('lodash');
const {
    HttpStatusError,
} = require('./errors');
const {
    parse,
} = require('./parser');
const {
    raw,
} = require('./transforms');
const Op = require('sequelize').Op;

class ModelHandler {
    constructor(model, defaults = {
        limit: 50,
        offset: 0,
    }) {
        this.model = model;
        this.defaults = defaults;
        this.custom = null;
        this.name = this.model.getTableName();
    }

    create() {
        const handle = (req, res, next) => {
            this.model
                .create(req.body)
                .then(respond)
                .catch(next);

            function respond(row) {
                res.status(201);
                res.send(res.transform(row));
            }
        };

        return [
            raw,
            handle,
        ];
    }

    get() {
        const handle = (req, res, next) => {
            this
                .findOne(req.params, req.options)
                .then(respond)
                .catch(next);

            function respond(row) {
                if (!row) {
                    throw new HttpStatusError(404, 'Not Found');
                }

                res.send(res.transform(row));
            }
        };

        return [
            raw,
            handle,
        ];
    }

    query() {

        const customQuery = (req) => new Promise((resolve, reject) => {
            if (!req.query.filter || req.query.filter === '')
                return resolve();
            const condiciones = [];
            const options = {};
            options.attributes = _.keys(this.model.rawAttributes);

            return this.model.describe().then(fields => {
                for (const key in fields) {
                    const field = fields[key];
                    const obj = {};

                    let aux;
                    let tipo = field.type;
                    let buscar = (options.attributes == null) ? true : options.attributes.indexOf(key) != -1;
                    console.log('Revisndo l interpretacion del searchPRO', req.query.searchPro == 1);
                    if (req.query.searchPro == 1 && buscar && req.query.tipoBus == 'campo')
                        buscar = req.query.campoSel == key;

                    if (req.query.searchPro == 1 && req.query.tipoBus == 'documento') {
                        console.log('SearchPro_Ddocumento'.bgWhite.red);
                        buscar = false;
                        if (key == 'plantilla_valor') {
                            obj[key] = {
                                "$ilike": `%${req.query.filter}%`,
                            };
                            // xfilter.push(obj);
                        }
                    }
                    if (req.query.searchPro == 1 && req.query.tipoBus == 'flujo') {
                        console.log('SearchPro_Ddocumento'.bgWhite.red);

                        buscar = false;
                        if (key == 'grupo') {
                            obj[key] = req.query.filter;
                            // obj[i] = { $ilike:"%"+req.query.filter+"%" };
                            // xfilter.push(obj);
                        }
                    }

                    if (tipo.indexOf('CHARACTER VARYING') > -1)
                        tipo = 'CHARACTER VARYING';
                    switch (tipo) {
                        case 'INTEGER':
                            aux = parseInt(req.query.filter);
                            if (!isNaN(aux) && req.query.filter.indexOf("/") == -1) {
                                obj[key] = aux;
                            }
                            break;
                        case 'USER-DEFINED':

                            aux = req.query.filter;
                            for (const j in field.special) {
                                if (field.special[j].toLowerCase().indexOf(aux.toLowerCase()) == 0) {
                                    obj[key] = field.special[j];
                                }
                            }
                            break;
                        case 'TIMESTAMP WITH TIME ZONE':
                            // Busqueda de fechas del tipo: 2016-10-20, 2016/10/20, 20-10-2016, 20/10/2016.
                            console.log('TIMESTAMP WITH TIME ZONE __________________________'.magenta.bgWhite);
                            console.log('Primer procesado de fecha __________________'.magenta.bgWhite, procesarFecha(req.query.filter));
                            const consulta = procesarFecha(req.query.filter);
                            if (consulta != false) {
                                console.log('Fecha'.cyan, procesarFecha(req.query.filter));
                                obj[key] = procesarFecha(req.query.filter);
                                // condiciones.push(obj);
                            }
                            break;
                        case 'CHARACTER VARYING':
                            obj[key] = {
                                "$iLike": `%${req.query.filter}%`,
                            };
                            break;
                        case 'TEXT':
                            obj[key] = {
                                "$iLike": `%${req.query.filter}%`,
                            };
                            break;
                        case 'ARRAY':
                            // obj[key] = {"$iLike":`%${req.query.filter}%`};
                            break;
                        case 'BOOLEAN':
                            // obj[key] = {"$iLike":`%${req.query.filter}%`};
                            break;
                        default:
                            console.log('DEFAULT__________________________'.magenta.bgWhite, tipo);
                            obj[key] = req.query.filter;
                            break;
                    }

                    if (obj.hasOwnProperty(key)) {
                        condiciones.push(obj);
                    }



                }
            })
                .then(() => {
                    console.log('Finalizando filtrado custom'.bgCyan.black);
                    this.custom = condiciones;
                    console.log('Checking custom condition'.bgCyan.black, this.custom);
                    return resolve();
                });
        })
        const handle = (req, res, next) => {
            customQuery(req)
                .then(() => {
                    let flag = false;
                    if (this.custom !== null) {
                        flag = true;
                        req.query.filter = this.custom;
                        this.custom = null;
                    }


                    this
                        .findAndCountAll(req.query, req.options, flag)
                        .then(respond)
                        .catch(next);
                });

            function respond({
                rows,
                start,
                end,
                count,
            }) {
                res.set('Content-Range', `${start}-${end}/${count}`);

                if (count > end) {
                    res.status(206);
                } else {
                    res.status(200);
                }

                const response = {
                    total: count,
                    resultado: rows,
                }
                res.send(res.transform(response));
            }
        };

        return [
            raw,
            handle,
        ];
    }

    remove() {
        const handle = (req, res, next) => {
            this
                .findOne(req.params)
                .then(destroy)
                .then(respond)
                .catch(next);

            function destroy(row) {
                if (!row) {
                    throw new HttpStatusError(404, 'Not Found');
                }

                return row.destroy();
            }

            function respond() {
                res.sendStatus(204);
            }
        };

        return [
            handle,
        ];
    }

    update() {
        const handle = (req, res, next) => {
            console.log('[update] iniciando la modificacion ', req.params, req.body);
            this
                .findOne(req.params)
                .then(updateAttributes)
                .then(respond)
                .catch(next);

            function updateAttributes(row) {
                console.log('[update] row', row);
                if (!row) {
                    throw new HttpStatusError(404, 'Not Found');
                }

                // return row.updateAttributes(req.body);
                return row.update(req.body);
            }

            function respond(row) {
                res.send(res.transform(row));
            }
        };

        return [
            raw,
            handle,
        ];
    }

    findOne(params, options) {
        if (params.hasOwnProperty('id')) {
            params[`id_${this.name}`] = params.id;
            delete params.id;
        }
        if (options && options.hasOwnProperty('id')) {
            delete options.id;
            delete options.audit_usuario;

        }
        options = _.merge(parse(params, this.model), options);
        return this.model.findOne(options);
    }

    findAndCountAll(params, options, custom) {
        const parsed = parse(params, this.model, custom);

        options = _(parsed)
            .defaults(this.defaults)
            .merge(options)
            .value();
        if (custom) options.where["$or"] = params.filter;
        if (params.page) {
            options.offset = (params.page === 0 ? 0 : params.page - 1) * options.limit;
        }

        return this.model
            .findAndCountAll(options)
            .then(extract);

        function extract({
            count,
            rows,
        }) {
            const start = options.offset;
            const end = Math.min(count, options.offset + options.limit);

            return {
                rows,
                start,
                end,
                count,
            };
        }
    }
}

/**
      Funcion que procesa una cadena, verifica si tiene el formato de una fecha.
      @param {pCadena} Cadena de texto con formato de fecha.
      @return Retorna:
      EXITO -> un objeto de consulta con formato sequelize.
      FALLO -> false.
    */
function procesarFecha(pCadena) {

    let fecha = new Date(pCadena);
    let anio = null,
        inicio = null,
        fin = null;

    // Identifica el operador usando en la cadena para separar los datos.
    const operador = pCadena.indexOf('-') > -1 ? '-' : pCadena.indexOf('/') > -1 ? '/' : null;

    // Si existe un operador valido en la cadena.
    if (operador != null) {

        // Si la cadena no es valida como fecha, se la invierte.
        if (fecha == 'Invalid Date') {
            fecha = new Date(((pCadena.split(operador)).reverse()).join("-"));
        }
        // Obtine el año.
        anio = fecha.getFullYear();

        // Si existe el año.
        if (anio != null) {
            const vector = pCadena.split(operador)

            // Si la longitud del vector es igual a 3.
            if (vector.length == 3) {
                const indice = vector.indexOf(anio.toString());

                // Si el año existe dentro del vector de la cadena.
                if (indice > -1) {

                    // Armado de la fecha inicio y fecha fin.
                    if (indice == 0) {
                        inicio = `${vector[0]}-${vector[1]}-${vector[2]}`;
                        fin = `${vector[0]}-${vector[1]}-${parseInt(vector[2]) + 1}`;
                    } else if (indice == 2) {
                        inicio = `${vector[2]}-${vector[1]}-${vector[0]}`;
                        fin = `${vector[2]}-${vector[1]}-${parseInt(vector[0]) + 1}`;
                    }

                    // Armado de la respuesta a retornar.
                    const respuesta = {
                        $gte: inicio,
                        $lt: fin,
                    };
                    return respuesta;
                } else return false; // Fin condicional indice.
            } else return false; // Fin condicional longitud vector.
        } else return false; // Fin condicional existencia año.
    } else return false; // Fin condicional existencia operador.
}

module.exports = ModelHandler;