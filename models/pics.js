/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const pics = sequelize.define('pics', {
		path: DataTypes.STRING,
		created_at: DataTypes.DATE,
		updated_at: DataTypes.DATE
	}, {
		underscored: true
	});
	pics.associate = function () {
		// Associations can be defined here
	};

	return pics;
};
