const KoaRouter = require('koa-router');
const archiver = require("archiver")
const path = require("path")
const fs = require("fs")
const mm = require('music-metadata');
const mime = require('mime');

const router = new KoaRouter();

const updateAlbum = async ctx => {
	const {id} = ctx.params;
	if (ctx.request.type === 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To update album data, please post body as form'
		};
		return;
	}

	const albumData = await ctx.models.albums.findOne({
		where: {
			id
		}
	});
	if (!albumData) {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'album not found'
		};
		return;
	}

	const {name} = ctx.request.body;
	await ctx.models.albums.update({
		name
	}, {
		where: {
			id
		}
	});
	ctx.status = 200;
	ctx.body = {
		status: 'success',
		message: 'update',
		album: name
	};
};

const downloadAlbum = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no id'
		};
		return null;
	}

	const albumData = await ctx.models.albums.findOne({
		where: {
			id,
			'$songs.status$': 'ready'
		},
		attributes: ['id', 'name', 'pic_id', 'created_at', 'updated_at'],
		include: [
			{
				model: ctx.models.songs, attributes: ['id', 'name', 'artist_id', 'status', 'path'], include: [
					{model: ctx.models.artists, attributes: ['name']}
				]}
		]
	});

	if (albumData) {


		const zipper = () => new Promise(async (resolve, reject) => {
			const zipPath = path.resolve(__dirname, '..', '..', 'tmp', 'album.zip')

			const archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});

			const output = fs.createWriteStream(zipPath);

			output.on('close', function() {
				console.log(archive.pointer() + ' total bytes');
				console.log('archiver has been finalized and the output file descriptor has closed.');
				resolve(zipPath);
			});

			output.on('end', function() {
				console.log('Data has been drained');
			});

			archive.on('warning', function(err) {
				if (err.code === 'ENOENT') {
					// log warning
					reject(err);
				} else {
					// throw error
					reject(err);
				}
			});

			archive.pipe(output);

			for (const song of albumData.songs) {
				const metadata = await mm.parseFile(song.path).then(metadata => {
					return {track: metadata.common.track.no, disk: metadata.common.disk.no};
				});

				const extname = path.extname(song.path);
				let filename = song.name + extname;
				if (metadata.track !== null) {
					filename = `${String(metadata.track).padStart(2, '0')} - ${filename}`;
				}

				if (metadata.disk !== null) {
					filename = `${metadata.disk} - ${filename}`;
				}
				const stream = fs.createReadStream(song.path)
				archive.append(stream, { name: filename });
				console.log(filename)
			}

			archive.on('error', function(err) {
				reject(err);
			});

			archive.finalize();

		})
		const zipFile = await zipper()
		ctx.status = 200;
		ctx.body = fs.readFileSync(zipFile);
		ctx.attachment(albumData.name + ".zip");
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'album data not found'
		};
	}
}

const getAlbum = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no id'
		};
		return null;
	}

	const albumData = await ctx.models.albums.findOne({
		where: {
			id,
			'$songs.status$': 'ready'
		},
		attributes: ['id', 'name', 'pic_id', 'created_at', 'updated_at'],
		include: [
			{
				model: ctx.models.songs, attributes: ['id', 'name', 'artist_id', 'status'], include: [
					{model: ctx.models.artists, attributes: ['name']}
				]}
		]
	});
	if (albumData) {
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			data: {
				id: albumData.id,
				album: albumData.name,
				pic_id: albumData.pic_id,
				songs: albumData.songs.map(song => ({id: song.id, title: song.name, artist_id: song.artist_id, artist: song.artist.name})),
				created_at: ctx.helper.dateToString(albumData.created_at, 0),
				updated_at: ctx.helper.dateToString(albumData.updated_at, 0)
			}
		};
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'album data not found'
		};
	}
};

const getAlbumList = async ctx => {
	const {like, or: Or} = ctx.Seq.Op;
	const {page: requestPage, count: requestCount, q: searchQuery} = ctx.query;
	const page = requestPage === undefined ? 0 : Number(requestPage);
	const count = requestCount === undefined ? 10 : Number(requestCount);
	ctx.logger.trace(`Request page: ${page}, and show number: ${count}`);
	ctx.logger.trace(`Request path: ${ctx.request.path}`);

	let whereQuery = {
	};
	if (searchQuery !== undefined && searchQuery !== '') {
		const escapedSearchQuery = searchQuery.replace(/(%|_)/g, '\\$1');
		whereQuery = {
			...whereQuery,
			[Or]: {
				name: {
					[like]: `%${escapedSearchQuery}%`
				}
			}
		};
	}

	const albumCount = await ctx.models.albums.findAll({
		where: whereQuery,
		include: [
			{model: ctx.models.songs, attributes: ['id']}
		]
	}).then(albums => albums.length);
	const maxPage = albumCount === 0 ? 0 : (albumCount % count === 0 ? (albumCount / count) - 1 : (albumCount - (albumCount % count)) / count);
	const minPage = 0;
	const nextPage = maxPage === page ? null : page + 1;
	const prevPage = minPage === page ? null : page - 1;
	/* eslint camelcase: ["error", {properties: "never"}] */
	const albumList = await ctx.models.albums.findAll({
		where: whereQuery,
		limit: count,
		offset: count * page,
		order: [['created_at', 'DESC']],
		attributes: ['id', 'name', 'created_at'],
		include: [
			{model: ctx.models.songs, attributes: ['id']}
		]
	}).then(albums => albums.map(album => ({
		album: album.name,
		song_count: album.songs.length,
		id: album.id
	})));
	ctx.body = {
		status: 'success',
		pages: {
			maxPage, minPage, nextPage, prevPage
		},
		links: {
			maxPage: ctx.request.path + `?page=${maxPage}&count=${count}&q=${searchQuery || ''}`,
			minPage: ctx.request.path + `?page=${minPage}&count=${count}&q=${searchQuery || ''}`,
			nextPage: nextPage === null ? null : ctx.request.path + `?page=${nextPage}&count=${count}&q=${searchQuery || ''}`,
			prevPage: prevPage === null ? null : ctx.request.path + `?page=${prevPage}&count=${count}&q=${searchQuery || ''}`
		},
		albums: albumList
	};
};

router.get('/', getAlbumList);
router.get('/:id', getAlbum);
router.get('/download/:id', downloadAlbum);
router.post('/:id', updateAlbum);

module.exports = router;

