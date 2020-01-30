import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import Router from 'next/router';
import {Typography, Grid, TextField, Container, Snackbar, Button} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import {makeStyles} from '@material-ui/styles';
import PropType from 'prop-types';

const useStyles = makeStyles(theme => ({
	textField: {
		marginLeft: theme.spacing(-2),
		marginRight: theme.spacing(-2)
	},
	containerGrid: {
		marginTop: theme.spacing(2)
	},
	img: {
		width: '100%'
	},
	picSkeleton: {
		width: '100%',
		height: '100%'
	},
	button: {
		width: '100%',
		marginLeft: theme.spacing(1),
		marginRight: theme.spacing(1)
	},
    inputButton: {
        opacity: 0,
        appearance: 'none',
        position: 'absolute',
        display: 'block',
        width: '100%',
        height: '100%'
    }
}));

const App = props => {
	const [open, setOpen] = useState(false);
	const [snackMessage, setSnackMessage] = useState('');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [oldPassword, setOldPassword] = useState('');
	const [password, setPassword] = useState('');
	const [imageURL, setImageURL] = useState('');
	const classes = useStyles();

	useEffect(() => {
		fetch(`/api/v1/user/${props.userId}`).then(x => x.json()).then(response => {
			if (response.status === 'error') {
				setSnackMessage(response.message);
				setOpen(true);
			} else {
				setName(response.data.name);
				setEmail(response.data.email);
				if (response.data.pic_id === null) {
					setImageURL('/assets/img/noimage.png');
				} else {
					setImageURL(`/api/v1/pic/${response.data.pic_id}`);
				}
			}
		});
	}, [props.userId]);

	const handleClose = () => {
		setOpen(false);
	};

	const fileUploadButtonOnClick = e => {
		const {files} = e.target;
		if (!files || files.length === 0) {
			setSnackMessage('File canceled');
			setOpen(true);
			return;
		}

		const [file] = files;

		if (!file.type.includes('image')) {
			setSnackMessage('Uploaded file is not valid image.');
			setOpen(true);
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		fetch(`/api/v1/user/${props.userId}`, {
			method: 'PATCH',
			body: formData
		}).then(x => x.json()).then(resp => {
			if (resp.status === 'error') {
				setSnackMessage('Uploaded file is not valid image.');
				setOpen(true);
			} else {
				setSnackMessage('User picture updated successfully.');
				setOpen(true);
				setImageURL(`/api/v1/pic/${resp.data.pic_id}?${Date.now()}`);
			}
		}).catch(error => {
			setSnackMessage('Cannot upload file.');
			setOpen(true);
			throw error;
		});
	};

	const submitButtonOnClick = () => {
		const formData = new FormData();
		formData.append('name', name);
		formData.append('email', email);
		formData.append('confirmpassword', oldPassword);
		formData.append('password', password);
		fetch(`/api/v1/user/${props.userId}`, {
			method: 'PATCH',
			body: formData
		}).then(x => x.json()).then(resp => {
			if (resp.status === 'error') {
				setSnackMessage(resp.message);
				setOpen(true);
			} else {
				setSnackMessage('User data updated successfully.');
				setOpen(true);
			}
		}).catch(error => {
			setSnackMessage('Cannot update user data.');
			setOpen(true);
			throw error;
		});
	};

	const resetButtonOnClick = () => {
		fetch(`/api/v1/user/${props.userId}`).then(x => x.json()).then(response => {
			if (response.status === 'error') {
				setSnackMessage(response.message);
				setOpen(true);
			} else {
				setName(response.data.name);
				setEmail(response.data.email);
				if (response.data.pic_id === null) {
					setImageURL('/assets/img/noimage.png');
				} else {
					setImageURL(`/api/v1/pic/${response.data.pic_id}`);
				}
			}
		});
	};

	return (
		<div>
			<Container maxWidth="md">
				<Grid container className={classes.containerGrid}>
					<Grid item md={4} xs={6}>
						<TextField
							fullWidth
							variant="outlined"
							id="standard-name"
							label="Name"
							className={classes.textField}
							value={name}
							margin="normal"
							onChange={e => {
								setName(e.target.value);
							}}
						/>
					</Grid>
					<Grid item md={4} xs={6}>
						<TextField
							fullWidth
							variant="outlined"
							id="standard-email"
							label="Email"
							className={classes.textField}
							value={email}
							type="email"
							margin="normal"
							onChange={e => {
								setEmail(e.target.value);
							}}
						/>
					</Grid>
					<Grid item md={4} xs={12}>
						<Typography
							variant="caption"
						>
                            Click image to change your profile image.
						</Typography>
						<div>
							{imageURL === '' ? (
								<Skeleton variant="rect" className={classes.picSkeleton}/>
							) : (
								<img className={classes.img} src={imageURL} onClick={() => document.querySelector('#fileUploadButton').click()}/>
							)}
						</div>
						<Button fullWidth color="primary" variant="contained">
							<input className={classes.inputButton} type="file" id="fileUploadButton" onChange={e => fileUploadButtonOnClick(e)}/>
							User image select...
						</Button>
					</Grid>
					<Grid item md={6} xs={6}>
						<TextField
							fullWidth
							variant="outlined"
							id="standard-old-password"
							label="Old Password"
							className={classes.textField}
							value={oldPassword}
							type="password"
							margin="normal"
							onChange={e => {
								setOldPassword(e.target.value);
							}}
						/>
					</Grid>
					<Grid item md={6} xs={6}>
						<TextField
							fullWidth
							variant="outlined"
							id="standard-new-password"
							label="New Password"
							className={classes.textField}
							value={password}
							type="password"
							margin="normal"
							onChange={e => {
								setPassword(e.target.value);
							}}
						/>
					</Grid>
					<Grid item md={6} xs={6}>
						<Button className={classes.button} variant="contained" color="primary" onClick={submitButtonOnClick}>Update</Button>
					</Grid>
					<Grid item md={6} xs={6}>
						<Button className={classes.button} variant="contained" color="secondary" onClick={resetButtonOnClick}>Reset</Button>
					</Grid>
				</Grid>
			</Container>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left'
				}}
				open={open}
				autoHideDuration={3000}
				ContentProps={{
					'aria-describedby': 'message-id'
				}}
				message={<span id="message-id">{snackMessage}</span>}
				onClose={handleClose}
			/>
		</div>
	);
};

App.propTypes = {
	userId: PropType.number
};

App.defaultProps = {
	userId: -1
};

const mapStateToProps = state => {
	return {
		...state.auth
	};
};

const mapDispatchToProps = () => {
	return {

	};
};

App.getInitialProps = async ({store, req, res}) => {
	if (res) {
		if (!req.isLoggedIn) {
			res.writeHead(302, {
				Location: '/login'
			});
			res.end();
		}
	} else {
		const state = store.getState();
		if (!state.auth.isLoggedIn) {
			Router.push('/login');
		}
	}

	return {
		searchVisible: false
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
