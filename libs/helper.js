const crypt = require('crypto');
const share = require('./share');

const zeroPadding = (str, max = 2) => (new Array(max).fill('0').join('') + str).slice(-max);
module.exports.zeroPadding = zeroPadding;
module.exports.dateToString = (date, rag = 0) => {
	const distDate = new Date(date);
	distDate.setHours(distDate.getHours() + rag);
	return `${zeroPadding(distDate.getFullYear(), 4)}-${zeroPadding(distDate.getMonth() + 1)}-${zeroPadding(distDate.getDate())} ${zeroPadding(distDate.getHours())}:${zeroPadding(distDate.getMinutes())}:${zeroPadding(distDate.getSeconds())}`;
};

module.exports.passwordHash = str => {
	const md5hash = crypt.createHash('md5');
	return md5hash.update(str + share.PASSWORDSALT, 'binary').digest('hex');
};

/**
 * @param {Object} obj - evaluate object
 * @returns {Object} - if obj is empty then returns undefined, but else returns obj
 */
module.exports.isEmpty = obj => obj === undefined || obj === '' ? undefined : obj;
