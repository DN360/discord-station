const path = require('path');
const fs = require('fs');
const KoaRouter = require('koa-router');
const mm = require('music-metadata');
const mime = require('mime');

const router = new KoaRouter();

const insertToDB = async ({ctx, album, artist, pictureName, createdPath, pictureBuf, title, copyToPath, status}) => {
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
		attributes: ['id', 'name']
	});

	let artistData = await ctx.models.artists.findOne({
		where: {
			name: artist
		},
		attributes: ['id', 'name']
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

	const picIdFromAlbumData = await ctx.models.albums.findOne({
		where: {
			id: albumData.id
		},
		attributes: ['pic_id']
	}).then(x => x.pic_id);
	let pictureData = await ctx.models.pics.findOne({
		where: {
			id: picIdFromAlbumData
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
			await ctx.models.albums.update({
				pic_id: pictureData.id
			}, {
				where: {
					id: albumData.id
				}
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
	return {
		songInstanceData: {
			name: title,
			artist_id: artistData.id,
			album_id: albumData.id,
			pic_id: pictureData ? pictureData.id : undefined,
			user_id: ctx.session.user_id,
			path: copyToPath,
			status
		},
		albumData,
		artistData,
		pictureData
	};
};

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
		return {copyToPath, createdPath, tmpPath};
	}).then(({copyToPath, createdPath, tmpPath}) => {
		return mm.parseFile(tmpPath)
			.then(metadata => {
				const {title, artist, album, picture: pictures} = metadata.common;
				ctx.logger.trace(`Title: ${title}, Artist: ${artist}, Album: ${album}, Album Cover Image Length: ${pictures === undefined ? 0 : pictures.length}`);
				return {copyToPath, title, artist, album, pictures: pictures === undefined ? [] : pictures, createdPath, tmpPath};
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
	}).then(({title, artist, album, copyToPath, pictures, createdPath, tmpPath}) => {
		if (title !== undefined && artist !== undefined && album !== undefined) {
			return {title, artist, album, copyToPath, pictures, createdPath, tmpPath, status: 'ready'};
		}

		return {
			title: title || path.basename(ctx.request.files.file.name).replace(path.extname(ctx.request.files.file.name), ''),
			artist: artist || '',
			album: album || '',
			copyToPath, pictures, createdPath, tmpPath, status: 'created'};
	}).then(async ({copyToPath, title, artist, album, pictures, createdPath, tmpPath, status}) => {
		let pictureName;
		let pictureBuf;

		if (status === 'ready') {
			if (pictures.length > 0) {
				const picture = pictures[0];
				const extname = '.' + mime.getExtension(picture.format);
				pictureBuf = picture.data;
				pictureName = extname;
			}

			const {songInstanceData, artistData, albumData, pictureData} = await insertToDB({ctx, album, artist, pictureName, createdPath, pictureBuf, title, copyToPath, status});

			const songInstance = ctx.models.songs.build(songInstanceData);
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
						pic_id: pictureData ? pictureData.id : undefined,
						user_id: ctx.session.user_id,
						status
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
		}

		const songInDB = await ctx.models.songs.findOne({
			where: {
				name: title,
				status: 'created'
			}
		});

		if (songInDB) {
			ctx.status = 202;
			ctx.body = {
				status: 'warning',
				message: 'song is uploaded successfully, but the file is already created in Database. Please update the song\'s data and change status to ready.',
				id: songInDB.id
			};
			return;
		}

		const songInstance = ctx.models.songs.build({
			name: title,
			artist_id: null,
			album_id: null,
			pic_id: null,
			path: copyToPath,
			user_id: ctx.session.user_id,
			status
		});
		return songInstance.save().then(songData => {
			ctx.status = 200;
			ctx.body = {
				status: 'created',
				message: 'created',
				id: songData.id,
				data: {
					title,
					album,
					artist
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
	const {title, artist, album} = ctx.request.body;
	const {id} = ctx.params;

	const createdSongData = await ctx.models.songs.findOne({
		where: {
			id,
			status: 'created'
		}
	});

	if (!createdSongData) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'not found'
		};
		return;
	}

	ctx.logger.trace(`Update song[id: ${id}], Title: ${title}, Artist: ${artist}, Album: ${album}`);
	const errorMessage = [];
	if (title === undefined || title === '') {
		ctx.status = 400;
		errorMessage.push('No title');
	}

	if (artist === undefined || artist === '') {
		ctx.status = 400;
		errorMessage.push('No artist');
	}

	if (album === undefined || album === '') {
		ctx.status = 400;
		errorMessage.push('No album');
	}

	if (ctx.status === 400) {
		ctx.body = {
			status: 'error',
			message: errorMessage.join(', ')
		};
		return;
	}

	await mm.parseFile(createdSongData.path)
		.then(metadata => {
			const {picture: pictures} = metadata.common;
			return {pictures: pictures === undefined ? [] : pictures};
		}).then(({pictures}) => {
			let pictureName;
			let pictureBuf;
			if (pictures.length > 0) {
				const picture = pictures[0];
				const extname = '.' + mime.getExtension(picture.format);
				pictureBuf = picture.data;
				pictureName = extname;
			}

			const createdPath = path.dirname(createdSongData.path);

			return insertToDB({ctx, album, artist, pictureName, createdPath, pictureBuf, title, copyToPath: createdSongData.path, status: 'ready'}).then(({songInstanceData, artistData, albumData, pictureData}) => {
				return ctx.models.songs.update({
					...songInstanceData,
					status: 'ready'
				}, {
					where: {
						id
					}
				}).then(() => {
					ctx.status = 200;
					ctx.body = {
						status: 'success',
						message: 'ready',
						dest: createdSongData.path,
						data: {
							title: createdSongData.name,
							artist: artistData.name,
							album: albumData.name,
							song_id: createdSongData.id,
							pic_id: pictureData ? pictureData.id : undefined,
							status: 'ready'
						}
					};
				});
			});
		});
};

const updateSong = async ctx => {
	const {id} = ctx.params;
	if (ctx.request.type === 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To update song data, please post body as form'
		};
	}

	const {title, album, artist} = ctx.request.body;
	const {files} = ctx.request;

	if (files.file) {
		if (files.file.type.indexOf('image') < 0) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: 'upload file is not valid image file'
			};
			fs.unlinkSync(files.file.path);
			return;
		}
	}

	ctx.logger.trace(`Update id: ${id}, Title: ${title}, Artist: ${artist}, Album: ${album}`);

	const updatedSongData = await ctx.models.songs.findOne({
		where: {
			id
		}
	});

	if (!updatedSongData) {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'not found'
		};
		return;
	}

	let artistData = await ctx.models.artists.findOne({
		where: {
			name: artist
		}
	});

	if (!artistData) {
		artistData = await ctx.models.artists.build({
			name: artist
		}).save();
	}

	let albumData = await ctx.models.albums.findOne({
		where: {
			name: album
		}
	});

	if (!albumData) {
		albumData = await ctx.models.albums.build({
			name: album
		}).save();
	}

	let newPictureId;

	if (files.file) {
		let newPicturePath = path.resolve(process.env.UPLOADDIR, albumData.id + path.extname(files.file.name));
		if (albumData.pic_id === null) {
			const pictureData = await ctx.models.pics.build({
				path: newPicturePath,
				album_id: albumData.id
			}).save();
			await ctx.models.albums.update({
				pic_id: pictureData.id
			}, {
				where: {
					id: albumData.id
				}
			});
			newPictureId = pictureData.id;
		} else {
			ctx.logger.trace(albumData.pic_id);
			const pictureData = await ctx.models.pics.findOne({
				where: {
					id: albumData.pic_id
				}
			});
			newPicturePath = pictureData.path;
		}

		fs.copyFileSync(files.file.path, newPicturePath);
	}

	await ctx.models.songs.update({
		name: title,
		artist_id: artistData.id,
		album_id: albumData.id,
		pic_id: newPictureId
	}, {
		where: {
			id
		}
	});

	ctx.status = 200;
	ctx.body = {
		status: 'success'
	};
	if (files.file) {
		fs.unlinkSync(files.file.path);
	}
};

const getContinueSongList = async ctx => {
	const whereQuery = {
		status: 'created'
	};
	if (!ctx.session.is_admin) {
		whereQuery.user_id = ctx.session.user_id;
	}

	const songList = await ctx.models.songs.findAll({
		where: whereQuery,
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']},
			{model: ctx.models.users, attributes: ['name']}
		]
	}).then(songs => songs.map(song => ({
		title: song.name,
		album: song.album === null ? '' : song.album.name,
		artist: song.artist === null ? '' : song.artist.name,
		album_id: song.album_id,
		artist_id: song.artist_id,
		pic_id: song.pic_id,
		user_id: song.user_id,
		id: song.id
	})));
	ctx.body = {
		status: 'success',
		data: songList.filter(Boolean)
	};
};

const getRandomSongList = async ctx => {
	const {count: requestCount, artistid, albumid, userid} = ctx.query;
	const count = requestCount === undefined ? 10 : Number(requestCount);
	ctx.logger.trace(`Request path: ${ctx.request.path}`);

	let whereQuery = {
		status: 'ready'
	};

	if (artistid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$artist.id$': artistid
		};
	}

	if (albumid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$album.id$': albumid
		};
	}

	if (userid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$user.id$': userid
		};
	}

	const songList = await ctx.models.songs.findAll({
		where: whereQuery,
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']},
			{model: ctx.models.users, attributes: ['name']}
		]
	}).then(songs => songs.map(song => ({
		title: song.name,
		album: song.album.name,
		artist: song.artist.name,
		album_id: song.album_id,
		artist_id: song.artist_id,
		pic_id: song.pic_id,
		user_id: song.user_id,
		id: song.id
	})));
	const randomCount = songList.length < count ? songList.length : count;
	const countedRandomList = songList.slice().map(x => [Math.random(), x]).sort().map(x => x[1]).slice(0, randomCount);
	ctx.body = {
		status: 'success',
		songs: countedRandomList
	};
};

const getSongList = async ctx => {
	const {like, or: Or} = ctx.Seq.Op;
	const {page: requestPage, count: requestCount, q: searchQuery, artistid, albumid, userid} = ctx.query;
	const uniqueKeys = [
		{key: 'q', value: ctx.helper.isEmpty(searchQuery)},
		{key: 'artistid', value: ctx.helper.isEmpty(artistid)},
		{key: 'albumid', value: ctx.helper.isEmpty(albumid)},
		{key: 'userid', value: ctx.helper.isEmpty(userid)}
	].filter(x => x.value !== undefined).map(x => `${x.key}-${x.value}`).join('&');
	const page = requestPage === undefined ? 0 : Number(requestPage);
	const count = requestCount === undefined ? 10 : Number(requestCount);
	ctx.logger.trace(`Request page: ${page}, and show number: ${count}`);
	ctx.logger.trace(`Request path: ${ctx.request.path}`);

	let whereQuery = {
		status: 'ready'
	};
	if (searchQuery !== undefined && searchQuery !== '') {
		const escapedSearchQuery = searchQuery.replace(/(%|_)/g, '\\$1');
		whereQuery = {
			...whereQuery,
			[Or]: {
				name: {
					[like]: `%${escapedSearchQuery}%`
				},
				'$artist.name$': {
					[like]: `%${escapedSearchQuery}%`
				},
				'$album.name$': {
					[like]: `%${escapedSearchQuery}%`
				}
			}
		};
	}

	if (artistid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$artist.id$': artistid
		};
	}

	if (albumid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$album.id$': albumid
		};
	}

	if (userid !== undefined) {
		whereQuery = {
			...whereQuery,
			'$user.id$': userid
		};
	}

	const songCount = await ctx.models.songs.findAll({
		where: whereQuery,
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']},
			{model: ctx.models.users, attributes: ['name']}
		]
	}).then(songs => songs.length);
	const maxPage = songCount === 0 ? 0 : songCount % count === 0 ? (songCount / count) - 1 : (songCount - (songCount % count)) / count;
	const minPage = 0;
	const nextPage = maxPage === page ? null : page + 1;
	const prevPage = minPage === page ? null : page - 1;
	const songList = await ctx.models.songs.findAll({
		where: whereQuery,
		limit: count,
		offset: count * page,
		order: [['created_at', 'DESC']],
		attributes: ['id', 'name', 'album_id', 'artist_id', 'pic_id', 'user_id', 'path'],
		include: [
			{model: ctx.models.albums, attributes: ['name']},
			{model: ctx.models.artists, attributes: ['name']},
			{model: ctx.models.users, attributes: ['name']}
		]
	}).then(songs => songs.map(song => ({
		title: song.name,
		album: song.album.name,
		artist: song.artist.name,
		album_id: song.album_id,
		artist_id: song.artist_id,
		pic_id: song.pic_id,
		user_id: song.user_id,
		id: song.id
	})));
	const nextQuery = `&count=${count}&q=${searchQuery || ''}&artistid=${artistid || ''}&albumid=${albumid || ''}&userid=${userid || ''}`;
	ctx.body = {
		status: 'success',
		pages: {
			maxPage, minPage, nextPage, prevPage
		},
		links: {
			maxPage: ctx.request.path + `?page=${maxPage}${nextQuery}`,
			minPage: ctx.request.path + `?page=${minPage}${nextQuery}`,
			nextPage: nextPage === null ? null : ctx.request.path + `?page=${nextPage}${nextQuery}`,
			prevPage: prevPage === null ? null : ctx.request.path + `?page=${prevPage}${nextQuery}`,
			uniqueKeys: uniqueKeys === '' ? 'recent' : uniqueKeys
		},
		songs: songList,
		uniqueKeys: uniqueKeys === '' ? 'recent' : uniqueKeys
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
			id,
			status: 'ready'
		},
		attributes: ['path']
	});
	if (songData && fs.existsSync(songData.path)) {
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
				album: songData.album === null ? '' : songData.album.name,
				artist: songData.artist === null ? '' : songData.artist.name,
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
		fs.unlinkSync(songData.path);
		await ctx.models.songs.destroy({
			where: {
				id
			}
		});
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
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'file not found'
		};
	}
};

router.post('/', createSong);
router.patch('/:id', patchSong);
router.put('/:id', updateSong);
router.get('/:id', getSong);
router.get('/meta/:id', getSongMetadata);
router.get('/continue/list', getContinueSongList);
router.get('/random/list', getRandomSongList);
router.get('/', getSongList);
router.delete('/:id', deleteSongMetadata);

module.exports = router;

