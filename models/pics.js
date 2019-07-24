/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const pics = sequelize.define('pics', {
		path: DataTypes.STRING
	}, {
		underscored: true
	});
	pics.associate = function (models) {
		// Associations can be defined here
		pics.belongsTo(models.songs, {
			sourceKey: 'id',
			targetKey: 'pic_id'
		});
	};

	return pics;
};
