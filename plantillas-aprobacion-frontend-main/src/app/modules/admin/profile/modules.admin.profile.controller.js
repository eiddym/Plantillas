(function() {
	'use strict';

	angular
	.module('app')
	.controller('ProfileController', ProfileController);

	/** @ngInject */
	function ProfileController(Storage, SideNavFactory, Datetime, DataService, restUrl, Message) {
		var vm = this;

		vm.getColor = function () {
			return SideNavFactory.userColor;
		}

		vm.getName = function () {
			var user = SideNavFactory.getUser();
			return user.first_name + ' ' + user.last_name;
		}

		vm.getEmail = function () {
			return SideNavFactory.getUser().email;
		}

		vm.getInitial = function () {
			var firstName = SideNavFactory.getUser().first_name;
			return firstName.length ? firstName[0].toUpperCase() : '?';
		}

		vm.getData = function (key) {

			var value = SideNavFactory.getUser()[key];
			if (['last_login', 'date_joined'].indexOf(key) != -1) {
				return Datetime.datetimeLiteral(new Date(value));
			}

			return value;
		}

		vm.getEsJefe = function () {
			return SideNavFactory.getUser().es_jefe || false;
		}

		vm.abrirEditar = function (acc){
			if(acc=='editar_notificaciones'){
				// DataService.get(restUrl + "notificacion/conf_notificacion/?fields=id_conf_notificacion,canal,enviado,celular,observado,aprobado,derivado&fid_usuario="+vm.getData('id'))
				DataService.get(restUrl + "notificacion/conf_notificacion/?fields=id_conf_notificacion,canal,enviado,observado,derivado,aprobar_ciudadania,aprobados_ciudadania,canal_habilitado&fid_usuario="+vm.getData('id'))
				.then(function (respuesta) {
					vm.swEditarCuenta = acc;
					vm.ca = respuesta.datos.resultado[0];
					vm.ca.email = vm.getEmail();
				})

			}else {
				DataService.get(restUrl + "seguridad/usuario/", vm.getData('id'))
				.then(function (respuesta) {
					if(respuesta.datos){
						vm.numero_documento = respuesta.datos.numero_documento;
						vm.nombre_usuario = respuesta.datos.usuario;
						vm.email = respuesta.datos.email;
						vm.nombres = respuesta.datos.nombres;
						vm.apellidos = respuesta.datos.apellidos;
						if(acc == "editar_cuenta"){
							vm.contrasena = respuesta.datos.contrasena;
						}
						vm.swEditarCuenta = acc;
					}
				});
			}
		}
		vm.editarCuenta = function (){
			var usuario_enviar = {
				id_usuario: vm.getData('id'),
				numero_documento: vm.numero_documento,
				usuario: vm.nombre_usuario,
				email: vm.email,
				nombres: vm.nombres,
				apellido_paterno: vm.apellidos,
				_usuario_modificacion: vm.getData('id')
			}
			var swPut = true;
			if (vm.swEditarCuenta == "editar_cuenta") {
				usuario_enviar.contrasena = vm.contrasena;
			}else if (vm.swEditarCuenta == "editar_contrasena") {
				if(vm.contrasena_nueva !== vm.contrasena_confirm){
					Message.error("Las contraseña a confirmar no coincide con la contraseña nueva!!");
					swPut = false;
				}
				usuario_enviar.verificarContrasena = vm.contrasena;
				usuario_enviar.contrasena = vm.contrasena_nueva;
			}
			if(swPut){
				DataService.put(restUrl + "seguridad/usuario/"+vm.getData('id'), usuario_enviar)
				.then(function (respuesta) {
					if(respuesta.datos){
						vm.numero_documento = null;
						vm.nombre_usuario = null;
						vm.email = null;
						vm.nombres = null;
						vm.apellidos = null;

						vm.contrasena = null;
						vm.contrasena_nueva = null;
						vm.contrasena_confirm = null;
						var user_set={
							id: respuesta.datos.id_usuario,
							username: respuesta.datos.usuario,
							first_name: respuesta.datos.nombres,
							last_name: respuesta.datos.apellido_paterno+" "+respuesta.datos.apellido_materno,
							cargo: respuesta.datos.cargo,
							doc: respuesta.datos.numero_documento,
							email: respuesta.datos.email,
							date_joined: respuesta.datos._fecha_creacion
						}
						// Set user
						SideNavFactory.setUser(user_set);
						Storage.setUser(user_set);
						vm.swEditarCuenta = null;
						Message.show(respuesta.tipoMensaje, respuesta.mensaje);
					}
				});
			}
		}
		vm.editarConfiguracion = function () {
			var conf_enviar = angular.copy(vm.ca)
			DataService.put(restUrl + "notificacion/conf_notificacion/"+conf_enviar.id_conf_notificacion, conf_enviar)
			.then(function (respuesta) {
				Message.show(respuesta.tipoMensaje, respuesta.mensaje);
				vm.swEditarCuenta = null;
			})
		}


		vm.cancelarEditar = function () {
			vm.numero_documento = null;
			vm.nombre_usuario = null;
			vm.email = null;
			vm.nombres = null;
			vm.apellidos = null;

			vm.contrasena = null;
			vm.contrasena_nueva = null;
			vm.contrasena_confirm = null;

			vm.swEditarCuenta=null;
		}

	}
})();
