
module.exports = (sequelize, DataType) => {
  const monitor = sequelize.define("monitor", {
    id_monitor: {
      type:DataType.INTEGER,
      primaryKey:true,
      autoIncrement:true,
      xlabel:'ID',
    },
    fid_usuario:{
      type:DataType.INTEGER,
      allowNull:false,
      xlabel:'Usuario',
    },
    fid_documento:{
      type:DataType.INTEGER,
      allowNull:false,
      xlabel:'Documento',
    },
    fecha_visita:{
      type:DataType.DATEONLY,
      allowNull:false,
      xlabel:'Fecha de visita',
    },
    ip:{
      type:DataType.TEXT,
      allowNull: false,
      xlabel:'Direccion IP',
    },
    mac:{
      type:DataType.TEXT,
      xlabel:'Direccion MAC',
    },
    contador:{
      type:DataType.INTEGER,
      allowNull: false,
      xlabel:'Direccion IP',
    },
    relacionado:{
      type: DataType.BOOLEAN,
      defaultValue:false,
      xlabel: 'Tiene relacion',
    },
    cite:{
      type: DataType.BOOLEAN,
      defaultValue:false,
      xlabel: 'Tiene cite',
    },
    _usuario_creacion: {
        type: DataType.INTEGER,
        allowNull: false,
        xlabel: 'Usuario de creación',
    },
    _usuario_modificacion: {
        type: DataType.INTEGER,
        xlabel: 'Usuario de modificación',
    },
  },{
    createdAt:'_fecha_creacion',
    updatedAt:'_fecha_modificacion',
    freezeTableName:true,
    classMethods:{
      associate:(models) => {

      },
    },
  });
  return monitor;
};
