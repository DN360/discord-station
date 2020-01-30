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
import {AccountCircle, LibraryMusicRounded, AddRounded, Search as SearchIcon, AlbumRounded, PeopleAltRounded} from '@material-ui/icons';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import Router from 'next/router';
import Menu from '@material-ui/core/Menu';
import uuid from 'uuid/v4';
import * as authModule from '../../ducks/auth';
import * as songModule from '../../ducks/song';
import * as artistModule from '../../ducks/artist';
import * as albumModule from '../../ducks/album';
import * as queryModule from '../../ducks/query';

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
		[theme.breakpoints.down('sm')]: {
			marginLeft: theme.spacing(3),
			marginRight: theme.spacing(3),
			marginTop: theme.spacing(1),
			width: '100%'
		}
	},
	invisible: {
		opacity: 0,
		width: 0
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
	},
	iconsRoot: {
		marginLeft: 'auto'
	},
	appToolbar: {
		flexDirection: 'row',
		[theme.breakpoints.down('sm')]: {
			flexDirection: 'column'
		}
	}
}));

const MyAppBar = props => {
	const classes = useStyles();
	const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
	const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const searchQueryRef = useRef(searchQuery);
	const searchTokenRef = useRef('');
	const userOpen = Boolean(userMenuAnchorEl);
	const addOpen = Boolean(addMenuAnchorEl);
	const handleClose = type => {
		switch (type) {
			case "add":
				setAddMenuAnchorEl(null);
				break;
			default:
				setUserMenuAnchorEl(null);
		}
	};

	const {target, extraSearchQuery} = props;

	const handleMenu = (event, type) => {
		switch (type) {
			case "add":
				setAddMenuAnchorEl(event.currentTarget);
				break;
			default:
				setUserMenuAnchorEl(event.currentTarget);
		}
	};

	const searchEventHandler = (token, refToken, refQuery) => {
		if (token === refToken.current) {
			fetch(`/api/v1/${target}/?count=60&q=${encodeURIComponent(refQuery.current)}${extraSearchQuery === '' ? '' : `&${extraSearchQuery}`}`).then(x => x.json()).then(resp => {
				if (target === 'song') {
					props.songUpdate(resp.songs);
				}

				if (target === 'artist') {
					props.artistUpdate(resp.artists);
				}

				if (target === 'album') {
					props.albumUpdate(resp.albums);
				}

				props.setNextPage(resp.links.nextPage || '');
				props.setPageEnd(resp.links.nextPage !== null);
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
				<Toolbar className={classes.appToolbar}>
					<Typography variant="h6" className={classes.title}>
						{props.title || 'Discord-station'}
					</Typography>
					<div className={props.searchVisible ? classes.search : classes.invisible}>
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
					<div className={classes.iconsRoot}>
						<Link href="/">
							<IconButton
								aria-label="menu of this site"
								aria-controls="menu-site"
								aria-haspopup="true"
								color="inherit"
							>
								<LibraryMusicRounded/>
							</IconButton>
						</Link>
						<Link href="/album-list" as="/album">
							<IconButton
								aria-label="menu of album"
								aria-controls="album-site"
								aria-haspopup="true"
								color="inherit"
							>
								<AlbumRounded/>
							</IconButton>
						</Link>
						<Link href="/artist-list" as="/artist">
							<IconButton
								aria-label="menu of artist"
								aria-controls="artist-site"
								aria-haspopup="true"
								color="inherit"
							>
								<PeopleAltRounded/>
							</IconButton>
						</Link>
						<IconButton
							aria-label="add menu"
							aria-controls="menu-add"
							aria-haspopup="true"
							color="inherit"
							onClick={e => handleMenu(e, "add")}
						>
							<AddRounded/>
						</IconButton>
						<Menu
							id="menu-add"
							anchorEl={addMenuAnchorEl}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							open={addOpen}
							onClose={() => handleClose("add")}
						>
							<MenuItem onClick={() => Router.push("/add-song")}>Add new song</MenuItem>
							<MenuItem onClick={() => Router.push("/add-user")}>Add new user</MenuItem>
						</Menu>
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
							anchorEl={userMenuAnchorEl}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
							open={userOpen}
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
	songUpdate: PropTypes.func.isRequired,
	artistUpdate: PropTypes.func.isRequired,
	albumUpdate: PropTypes.func.isRequired,
	setNextPage: PropTypes.func.isRequired,
	setPageEnd: PropTypes.func.isRequired,
	searchVisible: PropTypes.bool,
	target: PropTypes.string,
	extraSearchQuery: PropTypes.string
};

MyAppBar.defaultProps = {
	title: 'Discord-station',
	searchVisible: true,
	target: 'song',
	extraSearchQuery: ''
};

const mapStateToProps = state => {
	return {
		...state.auth,
		...state.song,
		...state.album,
		...state.artist,
		...state.query
	};
};

const mapDispatchToProps = dispatch => {
	return {
		setAuth: authProps => dispatch(authModule.initial(authProps.isLoggedIn, authProps.isAdmin, authProps.userId)),
		songUpdate: songList => dispatch(songModule.update(songList)),
		artistUpdate: artistList => dispatch(artistModule.update(artistList)),
		albumUpdate: albumList => dispatch(albumModule.update(albumList)),
		setNextPage: nextPage => dispatch(queryModule.nextPage(nextPage)),
		setPageEnd: pageEnd => dispatch(queryModule.pageEnd(pageEnd))
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(MyAppBar);
