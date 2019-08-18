import React, {useState, useRef} from 'react';
import {connect} from 'react-redux';
import Link from 'next/link';
import {makeStyles} from '@material-ui/styles';
import {fade} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import HomeRounded from '@material-ui/icons/HomeRounded';
import {AddRounded} from '@material-ui/icons';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Router from 'next/router';
import Menu from '@material-ui/core/Menu';
import uuid from 'uuid/v4';
import * as authModule from '../../ducks/auth';
import * as songModule from '../../ducks/song';

const useStyles = makeStyles(theme => ({
	root: {
		flexGrow: 1,
		maxWidthXl: true
	},
	menuButton: {
		marginRight: theme.spacing(2)
	},
	title: {
		flexGrow: 1,
		[theme.breakpoints.down('sm')]: {
			display: 'none'
		},
		[theme.breakpoints.up('md')]: {
			display: 'inherit'
		}
	},
	search: {
		position: 'relative',
		borderRadius: theme.shape.borderRadius,
		backgroundColor: fade(theme.palette.common.white, 0.15),
		'&:hover': {
			backgroundColor: fade(theme.palette.common.white, 0.25)
		},
		marginRight: theme.spacing(0),
		marginLeft: 'auto',
		width: 'auto',
		[theme.breakpoints.up('md')]: {
			marginLeft: theme.spacing(3),
			width: 'auto'
		}
	},
	searchIcon: {
		width: theme.spacing(7),
		height: '100%',
		position: 'absolute',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	inputRoot: {
		color: 'inherit'
	},
	inputInput: {
		padding: theme.spacing(1, 1, 1, 7),
		transition: theme.transitions.create('width'),
		width: '100%',
		[theme.breakpoints.up('md')]: {
			width: 200
		}
	}
}));

const MyAppBar = props => {
	const classes = useStyles();
	const [anchorEl, setAnchorEl] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const searchQueryRef = useRef(searchQuery);
	const searchTokenRef = useRef('');
	const open = Boolean(anchorEl);
	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleMenu = event => {
		setAnchorEl(event.currentTarget);
	};

	const searchEventHandler = (token, refToken, refQuery) => {
		if (token === refToken.current) {
			fetch(`/api/v1/song/?count=60&q=${encodeURIComponent(refQuery.current)}`).then(x => x.json()).then(resp => {
				props.songUpdate(resp.songs);
			});
		}
	};

	const logoutMenuItemOnClick = () => {
		fetch('/api/v1/auth/logout').then(() => {
			props.setAuth({isLoggedIn: false, isAdmin: false, userId: -1});
			Router.push('/login');
		});
	};

	const LinkToProfileMenuItemOnClick = () => {
		Router.push('/profile');
	};

	return (
		<div className={classes.root}>
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" className={classes.title}>
						{props.title || 'Discord-station'}
					</Typography>
					<div className={classes.search}>
						<div className={classes.searchIcon}>
							<SearchIcon/>
						</div>
						<InputBase
							placeholder="Search…"
							classes={{
								root: classes.inputRoot,
								input: classes.inputInput
							}}
							inputProps={{'aria-label': 'search'}}
							value={searchQuery}
							onChange={e => {
								setSearchQuery(e.target.value);
								const token = uuid();
								searchTokenRef.current = token;
								searchQueryRef.current = e.target.value;
								setTimeout(searchEventHandler, 1000, token, searchTokenRef, searchQueryRef);
							}}
						/>
					</div>
					<div>
						<Link href="/">
							<IconButton
								aria-label="menu of this site"
								aria-controls="menu-site"
								aria-haspopup="true"
								color="inherit"
							>
								<HomeRounded/>
							</IconButton>
						</Link>
						<Link href="/add-song">
							<IconButton
								color="inherit"
							>
								<AddRounded/>
							</IconButton>
						</Link>
						<IconButton
							aria-label="account of current user"
							aria-controls="menu-account"
							aria-haspopup="true"
							color="inherit"
							onClick={handleMenu}
						>
							<AccountCircle/>
						</IconButton>
						<Menu
							id="menu-account"
							anchorEl={anchorEl}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							open={open}
							onClose={handleClose}
						>
							<MenuItem onClick={LinkToProfileMenuItemOnClick}>Profile</MenuItem>
							<MenuItem onClick={logoutMenuItemOnClick}>Logout</MenuItem>
						</Menu>
					</div>
				</Toolbar>
			</AppBar>
		</div>
	);
};

MyAppBar.propTypes = {
	title: PropTypes.string,
	setAuth: PropTypes.func.isRequired,
	songUpdate: PropTypes.func.isRequired
};

MyAppBar.defaultProps = {
	title: 'Discord-station'
};

const mapStateToProps = state => {
	return {
		...state.auth,
		...state.song
	};
};

const mapDispatchToProps = dispatch => {
	return {
		setAuth: authProps => dispatch(authModule.initial(authProps.isLoggedIn, authProps.isAdmin, authProps.userId)),
		songUpdate: songList => dispatch(songModule.update(songList))
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(MyAppBar);
