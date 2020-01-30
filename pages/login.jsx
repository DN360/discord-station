import React, {useState} from 'react';
import {connect} from 'react-redux';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/styles';
import Router from 'next/router';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import Snackbar from '@material-ui/core/Snackbar';
import * as authModule from '../ducks/auth';

const useStyles = makeStyles(theme => ({
	root: {
		padding: theme.spacing(3, 3)
	},
	textField: {
		marginLeft: theme.spacing(0),
		marginRight: theme.spacing(0)
	},
	button: {
		marginRight: theme.spacing(2)
	}
}));

const App = props => {
	const [userName, setUserName] = useState('');
	const [password, setPassword] = useState('');
	const [snackMessage, setSnackMessage] = useState('');
	const [open, setOpen] = React.useState(false);
	const classes = useStyles();

	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}

		setOpen(false);
	};

	const loginButtonOnClick = () => {
		fetch('/api/v1/auth', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: userName,
				password
			})
		}).then(x => x.json()).then(res => {
			if (res.status === 'error') {
				setSnackMessage(res.message);
				setOpen(true);
			} else {
				props.setAuth(res.data);
				Router.push({
					pathname: '/'
				});
			}
		});
	};

	return (
		<Container maxWidth="md">
			<Box my={4}>
				<Paper className={classes.root}>
					<Typography variant="h5" component="h3">
						Login form
					</Typography>
					<TextField
						fullWidth
						label="Username"
						className={classes.textField}
						value={userName}
						margin="normal"
						variant="outlined"
						onChange={e => {
							setUserName(e.target.value);
						}}
					/>
					<TextField
						fullWidth
						label="Password"
						className={classes.textField}
						type="password"
						autoComplete="current-password"
						value={password}
						margin="normal"
						variant="outlined"
						onChange={e => {
							setPassword(e.target.value);
						}}
					/>
					<Button className={classes.button} variant="contained" color="primary" size="large" onClick={loginButtonOnClick}>Login</Button>
					<Button className={classes.button} variant="contained" color="default"
						size="large" onClick={() => {
							setUserName('');
							setPassword('');
						}}
					>Reset
					</Button>
				</Paper>
			</Box>
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
		</Container>
	);
};

App.propTypes = {
	setAuth: PropTypes.func.isRequired
};

const mapStateToProps = () => {
	return {
	};
};

const mapDispatchToProps = dispatch => {
	return {
		setAuth: authProps => dispatch(authModule.initial(authProps.isLoggedIn, authProps.isAdmin, authProps.userId))
	};
};

App.getInitialProps = async ({store, req, res}) => {
	if (res) {
		if (req.isLoggedIn) {
			res.writeHead(302, {
				Location: '/'
			});
			res.end();
		}
	} else {
		const state = store.getState();
		if (state.auth.isLoggedIn) {
			Router.push('/');
		}
	}
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

