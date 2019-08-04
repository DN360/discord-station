const fs = require('fs');
const path = require('path');
const mime = require('mime');
const KoaRouter = require('koa-router');

const router = new KoaRouter();

const getPicList = async ctx => {
	/* eslint camelcase: ["error", {properties: "never"}] */
	const pictureList = await ctx.models.pics.findAll().then(pics => pics.map(pic => ({
		id: pic.id,
		album_id: pic.album_id,
		album: pic.album.name
	})));
	ctx.status = 200;
	ctx.body = {
		status: 'success',
		pictureList
	};
};

const getPic = async ctx => {
	const {id} = ctx.params;
	const pictureData = await ctx.models.pics.findOne({
		where: {
			id
		}
	});
	if (pictureData && fs.existsSync(pictureData.path)) {
		ctx.status = 200;
		ctx.type = mime.getType(path.extname(pictureData.path));
		ctx.body = fs.readFileSync(pictureData.path);
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'not found'
		};
	}
};

router.get('/', getPicList);
router.get('/:id', getPic);

module.exports = router;

