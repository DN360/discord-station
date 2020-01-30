const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const uuidv4 = require('uuid/v4');

const router = new Router();

const getUserList = async ctx => {
	if (!ctx.session.is_admin) {
		return getUserData(ctx);
	}

	const userList = await ctx.models.users.findAll();
	/* eslint camelcase: ["error", {properties: "never"}] */
	ctx.status = 200;
	ctx.body = {
		status: 'success',
		data: userList.map(user => ({
			id: user.id,
			name: user.name,
			status: user.status,
			uuid: user.uuid,
			created_at: ctx.helper.dateToString(user.created_at)
		}))
	};
};

const getUserData = async ctx => {
	let {id} = ctx.params;

	if (id === undefined) {
		id = ctx.session.user_id;
	}

	id = Number(id);

	if (id !== ctx.session.user_id && !ctx.session.is_admin) {
		ctx.status = 403;
		ctx.body = {
			status: 'error',
			message: 'You can not access this API. Please check your privileges'
		};
		return;
	}

	const userData = await ctx.models.users.findOne({
		where: {
			id
		},
		include: [
			{model: ctx.models.songs, attributes: ['id']}
		]
	});
	if (userData === null) {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'user not found'
		};
		return;
	}

	/* eslint camelcase: ["error", {properties: "never"}] */
	ctx.status = 200;
	ctx.body = {
		status: 'success',
		data: {
			id: userData.id,
			name: userData.name,
			email: userData.email,
			status: userData.status,
			uuid: userData.uuid,
			pic_id: userData.pic_id,
			song_count: userData.songs.length,
			created_at: ctx.helper.dateToString(userData.created_at)
		}
	};
};

const createUser = async ctx => {
	const {or: Or} = ctx.Seq.Op;
	if (!ctx.session.is_admin) {
		ctx.status = 403;
		ctx.body = {
			status: 'error',
			message: 'You can not access this API. Please check your privileges'
		};
		return;
	}

	if (ctx.request.type !== 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To register new user, please post body as json'
		};
		return;
	}

	const {email, username, password} = ctx.request.body;

	if (username === '' || username === undefined) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Empty input: username'
		};
		return;
	}

	if (email === '' || email === undefined) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Empty input: email'
		};
		return;
	}

	if (password === '' || password === undefined) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Empty input: password'
		};
		return;
	}

	if (password.length < 8) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Password is required at least 8 letters.'
		};
		return;
	}

	const userData = await ctx.models.users.findOne({
		where: {
			[Or]: {
				name: username, email
			}
		},
		attributes: ['id']
	});

	if (userData !== null) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'The input user is already registered.'
		};
		return;
	}

	await ctx.models.users.build({
		name: username, password: ctx.helper.passwordHash(password), email, status: 'valid', uuid: uuidv4()
	}).save().then(insertUser => {
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			message: 'User registration is completed successfully.',
			id: insertUser.id
		};
	}).catch(error => {
		ctx.logger.error(error);
		ctx.status = 500;
		ctx.body = {
			status: 'error',
			message: 'The registration is failed'
		};
	});
};

const updateUser = async ctx => {
	/* eslint complexity: 0 */
	let {id} = ctx.params;

	const {name, email, password, confirmpassword} = ctx.request.body;
	const {files} = ctx.request;

	if (files && files.file) {
		if (!files.file.type.includes('image')) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: 'upload file is not valid image file'
			};
			fs.unlinkSync(files.file.path);
			return false;
		}
	}

	id = id === undefined ? ctx.session.user_id : id;

	if (id !== ctx.session.user_id && !ctx.session.is_admin) {
		ctx.status = 403;
		ctx.body = {
			status: 'error',
			message: 'You can not access this API. Please check your privileges'
		};
		return false;
	}

	const userDataInDB = await ctx.models.users.findOne({
		where: {
			id
		}
	});

	if (userDataInDB === null) {
		ctx.status = 404;
		ctx.body = {
			status: 'error',
			message: 'not found'
		};
		return false;
	}

	if (ctx.request.type === 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To update user, please post body as form'
		};
		return false;
	}

	const updateQuery = {};

	if (password !== undefined && password !== '') {
		if ((confirmpassword === undefined || confirmpassword === '') && !ctx.session.is_admin) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: 'Invalid update data, please check your old password.'
			};
			return;
		}

		if (userDataInDB.password !== ctx.helper.passwordHash(confirmpassword) && !ctx.session.is_admin) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: 'Invalid update data, please check your old password.'
			};
			return;
		}

		if (password.length < 8) {
			ctx.status = 400;
			ctx.body = {
				status: 'error',
				message: 'The length of password character is required for at least 8 charaters.'
			};
			return;
		}

		updateQuery.password = ctx.helper.passwordHash(password);
	}

	updateQuery.name = name !== undefined && name !== '' ? name : undefined;
	updateQuery.email = email !== undefined && email !== '' ? email : undefined;

	if (files.file) {
		let newPicturePath = path.resolve(process.env.UPLOADDIR, userDataInDB.id + path.extname(files.file.name));
		if (userDataInDB.pic_id === null) {
			const pictureData = await ctx.models.pics.build({
				path: newPicturePath,
				album_id: userDataInDB.id
			}).save();
			await ctx.models.albums.update({
				pic_id: pictureData.id
			}, {
				where: {
					id: userDataInDB.id
				}
			});
			updateQuery.pic_id = pictureData.id;
		} else {
			const pictureData = await ctx.models.pics.findOne({
				where: {
					id: userDataInDB.pic_id
				}
			});
			updateQuery.pic_id = pictureData.id;
			newPicturePath = pictureData.path;
		}

		fs.copyFileSync(files.file.path, newPicturePath);
		fs.unlinkSync(files.file.path);
	}

	await ctx.models.users.update(updateQuery, {
		where: {
			id
		}
	}).then(() => {
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			message: 'updated',
			data: updateQuery,
			id
		};
	}).catch(error => {
		ctx.logger.error(error);
		ctx.status = 500;
		ctx.body = {
			status: 'error',
			message: 'Cannot update user data'
		};
	});
};

router.get('/', getUserList);
router.get('/:id', getUserData);
router.post('/', createUser);
router.patch('/:id', updateUser);

module.exports = router;
