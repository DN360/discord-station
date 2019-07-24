/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const artists = sequelize.define('artists', {
		name: DataTypes.STRING
	}, {
		underscored: true
	});
	artists.associate = function (models) {
		// Associations can be defined here
		artists.hasMany(models.songs, {
			sourceKey: 'id',
			targetKey: 'artist_id'
		});
	};

	return artists;
};
