const path = require('path');
const fs = require('fs');
const KoaRouter = require('koa-router');
const mm = require('music-metadata');
const mime = require('mime');

const router = new KoaRouter();

const createSong = async ctx => {
	if (!ctx.request.files || !ctx.request.files.file) {
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

	let tmpPath;

	await ctx.helper.mkdirSync(path.resolve(__dirname, '..', '..', process.env.UPLOADDIR)).then(createdPath => {
		const newFileName = Date.now() + path.extname(ctx.request.files.file.name);
		const copyToPath = path.join(createdPath, newFileName);
		tmpPath = ctx.request.files.file.path + path.extname(ctx.request.files.file.name);
		fs.copyFileSync(ctx.request.files.file.path, tmpPath);
		ctx.logger.trace(tmpPath);
		return {newFileName, copyToPath, createdPath, tmpPath};
	}).then(({newFileName, copyToPath, createdPath, tmpPath}) => {
		return mm.parseFile(tmpPath)
			.then(metadata => {
				const {title, artist, album, picture: pictures} = metadata.common;
				ctx.logger.trace(`Title: ${title}, Artist: ${artist}, Album: ${album}, Album Cover Image Length: ${pictures.length}`);
				return {newFileName, copyToPath, title, artist, album, pictures, createdPath, tmpPath};
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
	}).then(({newFileName, title, artist, album, copyToPath, pictures, createdPath, tmpPath}) => {
		if (title !== undefined && artist !== undefined && album !== undefined) {
			return {title, artist, album, copyToPath, pictures, createdPath, tmpPath};
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
		fs.copyFileSync(tmpPath, copyToPath);
		return {skipDatabaseCreate: true};
	}).then(async ({copyToPath, title, artist, album, skipDatabaseCreate, pictures, createdPath, tmpPath}) => {
		if (skipDatabaseCreate) {
			return null;
		}

		let pictureName;
		let pictureBuf;

		if (pictures.length > 0) {
			const picture = pictures[0];
			const extname = '.' + mime.getExtension(picture.format);
			pictureBuf = picture.data;
			pictureName = extname;
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
			},
			attributes: ['id']
		});

		let artistData = await ctx.models.artists.findOne({
			where: {
				name: artist
			},
			attributes: ['id']
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

		let pictureData = await ctx.models.pics.findOne({
			where: {
				album_id: albumData.id
			},
			attributes: ['id']
		});

		if (pictureName !== undefined) {
			pictureName = path.resolve(createdPath, albumData.id + pictureName);
			fs.writeFileSync(pictureName, pictureBuf);
			const pictureInstance = ctx.models.pics.build({
				path: pictureName,
				album_id: albumData.id
			});
			if (!pictureData) {
				pictureData = await pictureInstance.save().catch(error => {
					ctx.logger.error(error);
					ctx.status = 500;
					ctx.body = {
						status: 'error',
						message: 'Cannot insert album picture data to database'
					};
				});
			}
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
			pic_id: pictureData ? pictureData.id : undefined,
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
					song_id: songData.id,
					pic_id: pictureData ? pictureData.id : undefined
				}
			};
			fs.copyFileSync(tmpPath, copyToPath);
		}).catch(error => {
			const isUniqueError = error.name === 'SequelizeUniqueConstraintError';
			if (!isUniqueError) {
				ctx.logger.error(error);
			}

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
	fs.unlinkSync(tmpPath);
};

const patchSong = async ctx => {

};

const updateSong = async ctx => {

};

const getListSong = async ctx => {
	const {page: requestPage, count: requestCount} = ctx.query;
	const page = requestPage === undefined ? 0 : Number(requestPage);
	const count = requestCount === undefined ? 10 : Number(requestCount);
	ctx.logger.trace(`Request page: ${page}, and show number: ${count}`);
	ctx.logger.trace(`Request path: ${ctx.request.path}`);
	const songCount = await ctx.models.songs.findAll().then(songs => songs.length);
	const maxPage = songCount % count === 0 ? (songCount / count) - 1 : (songCount - (songCount % count)) / count;
	const minPage = 0;
	const nextPage = maxPage === page ? null : page + 1;
	const prevPage = minPage === page ? null : page - 1;
	const songList = await ctx.models.songs.findAll({
		limit: count,
		offset: count * page,
		order: [['created_at', 'DESC']],
		attributes: ['id', 'name', 'album_id', 'artist_id', 'pic_id', 'path'],
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']}
		]
	}).then(songs => songs.map(song => ({
		title: song.name,
		album: song.album.name,
		artist: song.artist.name,
		album_id: song.album_id,
		artist_id: song.artist_id,
		pic_id: song.pic_id,
		id: song.id
	})));
	ctx.body = {
		status: 'success',
		pages: {
			maxPage, minPage, nextPage, prevPage
		},
		links: {
			maxPage: ctx.request.path + `?page=${maxPage}&count=${count}`,
			minPage: ctx.request.path + `?page=${minPage}&count=${count}`,
			nextPage: nextPage === null ? null : ctx.request.path + `?page=${nextPage}&count=${count}`,
			prevPage: prevPage === null ? null : ctx.request.path + `?page=${prevPage}&count=${count}`
		},
		songs: songList
	};
};

const getSong = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no file attached'
		};
		return null;
	}

	const songData = await ctx.models.songs.findOne({
		where: {
			id
		},
		attributes: ['path']
	});
	if (fs.existsSync(songData.path)) {
		ctx.type = mime.getType(path.extname(songData.path));
		ctx.body = fs.readFileSync(songData.path);
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'file not found'
		};
	}
};

const getSongMetadata = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no id'
		};
		return null;
	}

	const songData = await ctx.models.songs.findOne({
		where: {
			id
		},
		attributes: ['id', 'name', 'album_id', 'artist_id', 'pic_id', 'path', 'created_at', 'updated_at'],
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']}
		]
	});
	if (fs.existsSync(songData.path)) {
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			data: {
				title: songData.name,
				album: songData.album.name,
				artist: songData.artist.name,
				path: songData.path,
				id: songData.id,
				album_id: songData.album_id,
				artist_id: songData.artist_id,
				pic_id: songData.pic_id,
				created_at: ctx.helper.dateToString(songData.created_at),
				updated_at: ctx.helper.dateToString(songData.updated_at)
			}
		};
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'file not found'
		};
	}
};

const deleteSongMetadata = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no id'
		};
		return null;
	}

	const songData = await ctx.models.songs.findOne({
		where: {
			id
		},
		attributes: ['id', 'name', 'path'],
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']}
		]
	});
	if (fs.existsSync(songData.path)) {
		ctx.status = 200;
		ctx.body = {
			status: 'delete',
			data: {
				title: songData.name,
				album: songData.album.name,
				artist: songData.artist.name,
				path: songData.path,
				id: songData.id,
				album_id: songData.album.id,
				artist_id: songData.artist.id,
				pic_id: songData.pic_id
			}
		};
		fs.unlinkSync(songData.path);
		await ctx.models.songs.destroy({
			where: {
				id
			}
		});
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'file not found'
		};
	}
};

router.put('/', createSong);
router.patch('/:id', patchSong);
router.post('/:id', updateSong);
router.get('/:id', getSong);
router.get('/meta/:id', getSongMetadata);
router.get('/', getListSong);
router.delete('/:id', deleteSongMetadata);

module.exports = router;

