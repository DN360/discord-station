const zeroPadding = (str, max = 2) => (new Array(max).fill('0').join('') + str).slice(-max);
module.exports.zeroPadding = zeroPadding;
module.exports.dateToString = (date, rag = 0) => {
	const distDate = new Date(date);
	distDate.setHours(distDate.getHours() + rag);
	return `${zeroPadding(distDate.getFullYear(), 4)}-${zeroPadding(distDate.getMonth() + 1)}-${zeroPadding(distDate.getDate())} ${zeroPadding(distDate.getHours())}:${zeroPadding(distDate.getMinutes())}:${zeroPadding(distDate.getSeconds())}`;
};
