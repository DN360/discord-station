/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", {properties: false}] */
'use strict';
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const share = require('../libs/share');
const helper = require('../libs/helper');

module.exports = {
	up: queryInterface => {
		const md5 = crypto.createHash('md5');
		const password = md5.update('adminadmin' + share.PASSWORDSALT, 'binary').digest('hex');
		return queryInterface.bulkInsert('users', [{
			id: 0,
			name: 'admin',
			email: 'admin@example.com',
			password,
			uuid: uuidv4(),
			status: 'admin',
			created_at: helper.dateToString(Date.now() - (1000 * 60 * 60 * 9)),
			updated_at: helper.dateToString(Date.now() - (1000 * 60 * 60 * 9))
		}]);
	},

	down: queryInterface => {
		return queryInterface.bulkDelete('users', {
			id: 0
		});
	}
};
