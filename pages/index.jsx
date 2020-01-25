import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {makeStyles} from '@material-ui/styles';
import Container from '@material-ui/core/Container';
import InfiniteScroll from 'react-infinite-scroll-component';
import Router from 'next/router';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import {Typography} from '@material-ui/core';
import * as songModule from '../ducks/song';
import * as playerModule from '../ducks/player';
import SongCard from './src/song-card.jsx';

const useStyles = makeStyles(theme => ({
	root: {
		margin: 'auto',
		marginBottom: 64
	},
	title: {
		marginTop: theme.spacing(2)
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
	const [songs, setSongs] = useState(props.songList);
	const [nextPage, setNextPage] = useState('/api/v1/song?count=60');
	const [pageEnd, setPageEnd] = useState(true);
	const [page, setPage] = useState(0);
	const playingId = (props.cueList[props.cueIndex] || {id: -1}).id;
	useEffect(() => {
		fetch('/api/v1/song?count=60').then(x => x.json()).then(resp => {
			setSongs(resp.songs);
			setNextPage(resp.links.nextPage);
		});
	}, []);
	useEffect(() => {
		setSongs(props.songList);
	}, [props.songList]);

	const cardOnClick = songData => {
		props.setCueList(songs, songs.findIndex(x => x.id === songData.id));
		props.play();
	};

	return (
		<div>
			<Container maxWidth="md" className={classes.root}>
				<Grid container className={classes.scrollerParent}>
					<Grid item xs={12}>
						<Typography variant="h4" className={classes.title}>
							Recently uploaded song list.
						</Typography>
					</Grid>
					<InfiniteScroll
						className={classes.scroller}
						hasMore={pageEnd}
						dataLength={songs.length}
						next={() => {
							fetch(nextPage).then(x => x.json()).then(resp => {
								setSongs(array => [
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
							{songs ? songs.map(song => (
								<SongCard key={song.id} song={song} cardOnClick={cardOnClick} isPlaying={song.id === playingId}/>
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
	play: PropTypes.func.isRequired,
	cueList: PropTypes.array,
	cueIndex: PropTypes.number
};

App.defaultProps = {
	setCueList: () => {},
	songList: [],
	cueList: [],
	cueIndex: 0
};

const mapStateToProps = state => {
	return {
		...state.song,
		...state.auth,
		...state.player
	};
};

const mapDispatchToProps = dispatch => {
	return {
		updateSong: songData => dispatch(songModule.update(songData)),
		play: songData => dispatch(playerModule.play(songData)),
		setCueList: (songList, cueIndex = 0) => dispatch(playerModule.setCueList(songList, cueIndex))
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
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

