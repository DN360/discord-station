/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const albums = sequelize.define('albums', {
		name: DataTypes.STRING,
		pic_id: DataTypes.INTEGER
	}, {
		underscored: true
	});
	albums.associate = function (models) {
		// Associations can be defined here
		albums.hasMany(models.songs, {
			sourceKey: 'id',
			targetKey: 'album_id'
		});
		albums.belongsTo(models.pics, {
			sourceKey: 'pic_id',
			targetKey: 'id'
		});
	};

	return albums;
};
