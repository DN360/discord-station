import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {makeStyles} from '@material-ui/styles';
import Container from '@material-ui/core/Container';
import InfiniteScroll from 'react-infinite-scroll-component';
import Router from 'next/router';
import Link from 'next/link';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import {Typography} from '@material-ui/core';
import * as songModule from '../ducks/song';
import * as albumModule from '../ducks/album';
import * as playerModule from '../ducks/player';
import SongCard from './src/song-card.jsx';

const useStyles = makeStyles(theme => ({
	root: {
		margin: 'auto',
		marginBottom: 130
	},
	title: {
		marginTop: theme.spacing(2)
	},
	countTableHead: {
		width: 90
	},
	scroller: {
		width: '100%'
	},
	scrollerParent: {
		'&>div': {
			width: '100%'
		}
	}
}));

const App = props => {
	const classes = useStyles();
	const [listItems, setListItems] = useState(props.songList);
	const [nextPage, setNextPage] = useState('/api/v1/song?count=60');
	const [pageEnd, setPageEnd] = useState(true);
	const [page, setPage] = useState(0);
	const playingId = (props.cueList[props.cueIndex] || {id: -1}).id;
	const {id} = props;
	useEffect(() => {
		// 絞りターゲットのIDがないのであれば一覧を表示する
		setListItems([]);
		fetch(`/api/v1/song?count=60&albumid=${id}`).then(x => x.json()).then(resp => {
			setListItems(resp.songs);
			setNextPage(resp.links.nextPage);
			setPageEnd(resp.pages.nextPage !== null);
		});
	}, [id]);

	useEffect(() => {
		setListItems(props.songList);
	}, [props.songList]);

	useEffect(() => {
		setNextPage(props.queryNextPage);
		setPageEnd(props.queryPageEnd);
	}, [props.queryNextPage, props.queryPageEnd]);

	const cardOnClick = songData => {
		props.setCueList(listItems, listItems.findIndex(x => x.id === songData.id));
		props.play();
	};
	const stamp = Date.now()

	return (
		<div>
			<Container maxWidth="md" className={classes.root}>
				<Grid container className={classes.scrollerParent}>
					<Grid item xs={12}>
						<Typography variant="h4" className={classes.title}>
							{listItems.length === 0 ? 'loading...' : 'Album name: ' + listItems[0].album}
						</Typography>
					</Grid>
					<InfiniteScroll
						className={classes.scroller}
						hasMore={pageEnd}
						dataLength={listItems.length}
						next={() => {
							fetch(nextPage).then(x => x.json()).then(resp => {
								setListItems(array => [
									...array,
									...resp.songs
								]);
								setPageEnd(resp.pages.nextPage !== null);
								setNextPage(resp.links.nextPage);
							});
							setPage(page + 1);
						}}
					>
						<Grid container>
							{listItems ? listItems.map(song => (
								<SongCard key={'song-' + song.id} song={song} cardOnClick={cardOnClick} isPlaying={song.id === playingId} stamp={stamp}/>
							)) : (<Grid item>Loading...</Grid>)
							}
						</Grid>
					</InfiniteScroll>
				</Grid>
			</Container>
		</div>
	);
};

App.propTypes = {
	setCueList: PropTypes.func,
	songList: PropTypes.array,
	albumList: PropTypes.array,
	queryNextPage: PropTypes.string,
	queryPageEnd: PropTypes.bool,
	play: PropTypes.func.isRequired,
	cueList: PropTypes.array,
	cueIndex: PropTypes.number,
	id: PropTypes.number
};

App.defaultProps = {
	setCueList: () => { },
	songList: [],
	albumList: [],
	queryNextPage: '',
	queryPageEnd: true,
	cueList: [],
	cueIndex: 0,
	id: null
};

const mapStateToProps = state => {
	return {
		...state.song,
		...state.album,
		...state.auth,
		...state.player,
		...state.query
	};
};

const mapDispatchToProps = dispatch => {
	return {
		updateSong: songData => dispatch(songModule.update(songData)),
		updateAlbum: albumData => dispatch(albumModule.update(albumData)),
		play: songData => dispatch(playerModule.play(songData)),
		setCueList: (songList, cueIndex = 0) => dispatch(playerModule.setCueList(songList, cueIndex))
	};
};

App.getInitialProps = async ({store, req, res, query}) => {
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
		id: Number(query.id),
		target: 'song',
		extraSearchQuery: `albumid=${query.id}`
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

