const path = require('path');
const fs = require('fs');
const KoaRouter = require('koa-router');
const mm = require('music-metadata');

const router = new KoaRouter();

const songCreate = async ctx => {
	if (!ctx.request.files.file) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no file attached'
		};
		return;
	}

	if (ctx.request.files.file.type.indexOf('audio') < 0) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Upload file is not audio file'
		};
		fs.unlinkSync(ctx.request.files.file.path);
		return;
	}

	await ctx.helper.mkdirSync(path.resolve(__dirname, '..', '..', process.env.UPLOADDIR)).then(createdPath => {
		const newFileName = ctx.request.files.file.name;
		const copyToPath = path.join(createdPath, newFileName);
		fs.copyFileSync(ctx.request.files.file.path, copyToPath);
		return {newFileName, copyToPath};
	}).then(({newFileName, copyToPath}) => {
		return mm.parseFile(copyToPath)
			.then(metadata => {
				const {title, artist, album} = metadata.common;
				ctx.logger.trace(`Title: ${title}, Artist: ${artist}, Album: ${album}`);
				return {newFileName, copyToPath, title, artist, album};
			})
			.catch(error => {
				ctx.logger.error(error);
				ctx.status = 500;
				ctx.body = {
					status: 'error',
					message: 'Cannot read metadata from upload file',
					error
				};
			});
	}).then(({newFileName, title, artist, album, copyToPath}) => {
		if (title !== undefined && artist !== undefined && album !== undefined) {
			return {title, artist, album, copyToPath};
		}

		ctx.status = 200;
		ctx.body = {
			status: 'success',
			message: 'create',
			dest: newFileName,
			data: {
				title: title || null,
				artist: artist || null,
				album: album || null
			}
		};
		return {skipDatabaseCreate: true};
	}).then(async ({copyToPath, title, artist, album, skipDatabaseCreate}) => {
		if (skipDatabaseCreate) {
			return null;
		}

		ctx.logger.trace(ctx.models);

		const albumInstance = ctx.models.albums.build({
			name: album
		});
		const artistInstance = ctx.models.artists.build({
			name: artist
		});

		let albumData = await ctx.models.albums.findOne({
			where: {
				name: album
			}
		});

		let artistData = await ctx.models.artists.findOne({
			where: {
				name: artist
			}
		});

		if (!albumData) {
			albumData = await albumInstance.save().catch(error => {
				ctx.logger.error(error);
				ctx.status = 500;
				ctx.body = {
					status: 'error',
					message: 'Cannot insert album data to database'
				};
			});
		}

		if (!artistData) {
			artistData = await artistInstance.save().catch(error => {
				ctx.logger.error(error);
				ctx.status = 500;
				ctx.body = {
					status: 'error',
					message: 'Cannot insert artist data to database'
				};
			});
		}

		/* eslint camelcase: ["error", {properties: "never"}] */
		const songInstance = ctx.models.songs.build({
			name: title,
			artist_id: artistData.id,
			album_id: albumData.id,
			path: copyToPath
		});
		return songInstance.save().then(songData => {
			ctx.status = 200;
			ctx.body = {
				status: 'success',
				message: 'ready',
				dest: songData.path,
				data: {
					title: songData.name,
					artist: artistData.name,
					album: albumData.name,
					song_id: songData.id
				}
			};
		}).catch(error => {
			ctx.logger.error(error);
			const isUniqueError = error.name === 'SequelizeUniqueConstraintError';
			ctx.status = isUniqueError ? 400 : 500;
			ctx.body = {
				status: 'error',
				message: 'Cannot insert song data to database' + (isUniqueError ? ', submit song is already in database' : '')
			};
		});
	}).catch(error => {
		ctx.logger.error(error);
		ctx.status = 500;
		ctx.body = {
			status: 'error',
			message: 'Cannot create upload file',
			error
		};
	});
	fs.unlinkSync(ctx.request.files.file.path);
};

const songUpdate = async ctx => {

};

router.put('/create', songCreate);
router.post('/update', songUpdate);

module.exports = router;

