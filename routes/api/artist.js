const KoaRouter = require('koa-router');

const router = new KoaRouter();

const updateArtist = async ctx => {
	const {id} = ctx.params;
	if (ctx.request.type === 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To update artist data, please post body as form'
		};
		return;
	}

	const artistData = await ctx.models.artists.findOne({
		where: {
			id
		}
	});
	if (!artistData) {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'artist not found'
		};
		return;
	}

	const {name} = ctx.request.body;
	await ctx.models.artists.update({
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
		artist: name
	};
};

const getArtist = async ctx => {
	const {id} = ctx.params;
	if (!id) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'no id'
		};
		return null;
	}

	const artistData = await ctx.models.artists.findOne({
		where: {
			id,
			'$songs.status$': 'ready'
		},
		attributes: ['id', 'name', 'created_at', 'updated_at'],
		include: [
			{
				model: ctx.models.songs, attributes: ['id', 'name', 'album_id', 'status'], include: [
					{model: ctx.models.albums, attributes: ['name']}
				]}
		]
	});
	if (artistData) {
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			data: {
				id: artistData.id,
				artist: artistData.name,
				songs: artistData.songs.map(song => ({id: song.id, title: song.name, album_id: song.album_id, album: song.album.name})),
				created_at: ctx.helper.dateToString(artistData.created_at, 0),
				updated_at: ctx.helper.dateToString(artistData.updated_at, 0)
			}
		};
	} else {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'artist data not found'
		};
	}
};

const getArtistList = async ctx => {
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

	const artistCount = await ctx.models.artists.findAll({
		where: whereQuery,
		include: [
			{model: ctx.models.songs, attributes: ['id']}
		]
	}).then(artists => artists.length);
	const maxPage = artistCount === 0 ? 0 : artistCount % count === 0 ? (artistCount / count) - 1 : (artistCount - (artistCount % count)) / count;
	const minPage = 0;
	const nextPage = maxPage === page ? null : page + 1;
	const prevPage = minPage === page ? null : page - 1;
	/* eslint camelcase: ["error", {properties: "never"}] */
	const artistList = await ctx.models.artists.findAll({
		where: whereQuery,
		limit: count,
		offset: count * page,
		order: [['created_at', 'DESC']],
		attributes: ['id', 'name', 'created_at'],
		include: [
			{model: ctx.models.songs, attributes: ['id']}
		]
	}).then(artists => artists.map(artist => ({
		artist: artist.name,
		song_count: artist.songs.length,
		id: artist.id
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
		artists: artistList
	};
};

router.get('/', getArtistList);
router.get('/:id', getArtist);
router.post('/:id', updateArtist);

module.exports = router;

