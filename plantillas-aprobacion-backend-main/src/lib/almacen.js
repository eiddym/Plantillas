require('colors');
const axios = require('axios');
const _ = require('lodash');
const config = require('../config/config')();
const headers = {
  'Authorization': config.almacen.token,
};

module.exports = {
  
  crearSolicitud: (solicitante, responsable, items, id) => new Promise((resolve, reject) => {
    const datos = {
      solicitante,
      responsable,
      items,
      id,
    }
    return axios({
      method: 'post',
      url: config.almacen.url_crear_solicitud,
      headers,
      data: datos,
    })
    .then(resp => {
      if (resp.status !== 200) throw Error('Estado diferente al de exito.');
      if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
      return resolve(resp.data);
    })
    .catch(error => {
      let respError = error;
      if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
      else respError = 'El sistema de almacenes no se encuentra disponible en estos momentos.';
      return reject(respError);
    });
  }),

  consultar: (textoBuscar, todos) => {
    let url = config.almacen.url_consulta;
    if (textoBuscar) url = `${url}?descripcion=${textoBuscar}`;
    if (todos && todos == 1) url += '&todos=1';
    return new Promise((resolve, reject) => axios({
      method: 'get',
      url,
      headers,
    })
    .then(resp => {
      if (resp.status !== 200) throw Error('Estado diferente al de exito.');
      if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
      return resolve(resp.data.items);
    })
    .catch(error => {
      let respError = error;
      if (error.status == 401) respError = Error('Credenciales de acceso invalidas');
      if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
      return reject(respError);
    }));
  },

  recuperar: (id) => new Promise((resolve, reject) => {
    if (!id) return resolve([]);
    const url = `${config.almacen.url_recuperar}?id=${id}`;
    return axios({
      method: 'get',
      url,
      headers,
    })
    .then(resp => {
      if (resp.status !== 200) throw Error('Estado diferente al de exito.');
      if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
      const datos = resp.data.datos.items || [];
      datos.map(item => {
        item.cantidad = item.cantidad_entregada;
        item.solicitado = item.cantidad_solicitada;
      });
      return resolve({
        cabecera: resp.data.datos.cabecera,
        items: datos,
      });
    })
    .catch(error => {
      let respError = error;
      if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
      return reject(respError);
    });
  }),

  notificar: (datos) => new Promise((resolve, reject) => axios({
    method: 'patch',
    url: config.almacen.url_notificar,
    headers,
    data: datos,
  })
  .then(() => resolve())
  .catch(error => reject(error))),

  consultarProveedores: (textoBuscar) => new Promise((resolve, reject) => {
    if (!textoBuscar || textoBuscar.length == 0) return resolve([]);
    return axios({
      method: 'get',
      url: `${config.almacen.url_proveedor}?descripcion=${textoBuscar}`,
      headers,
    })
    .then(resp => {
      if (resp.status !== 200) throw Error('Estado diferente al de exito.');
      if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
      return resolve(resp.data.datos);
    })
    .catch(error => {
      let respError = error;
      if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
      return reject(respError);
    });
  }),

  crearIngreso: (datos) => new Promise((resolve, reject) => axios({
    method: 'post',
    url: config.almacen.url_ingreso,
    headers,
    data: datos,
  })
  .then(resp => {
    if (resp.status !== 200) throw Error('Estado diferente al de exito.');
    if (resp.data.finalizado === false) throw Error('La peticion no fue procesada completamente.');
    return resolve(resp.data);
  })
  .catch(error => {
    let respError = error;
    if (error.response && error.response.data && error.response.data.mensaje) respError = error.response.data.mensaje;
    return reject(respError);
  })),
};