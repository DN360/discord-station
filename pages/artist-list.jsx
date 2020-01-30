import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {makeStyles} from '@material-ui/styles';
import Container from '@material-ui/core/Container';
import InfiniteScroll from 'react-infinite-scroll-component';
import Router from 'next/router';
import Link from 'next/link';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import {Typography, TableContainer, TableHead, TableCell, Table, TableRow, TableBody, Paper} from '@material-ui/core';
import * as songModule from '../ducks/song';
import * as artistModule from '../ducks/artist';
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
	useEffect(() => {
		// 絞りターゲットのIDがないのであれば一覧を表示する
		fetch('/api/v1/artist?count=60').then(x => x.json()).then(resp => {
			setListItems(resp.artists);
			setNextPage(resp.links.nextPage);
			setPageEnd(resp.pages.nextPage !== null);
		});
	}, []);

	useEffect(() => {
		setListItems(props.artistList);
	}, [props.artistList]);

	useEffect(() => {
		setNextPage(props.queryNextPage);
		setPageEnd(props.queryPageEnd);
	}, [props.queryNextPage, props.queryPageEnd]);

	const cardOnClick = songData => {
		props.setCueList(listItems, listItems.findIndex(x => x.id === songData.id));
		props.play();
	};

	// ターゲットのリストを表示する
	return (
		<div>
			<Container maxWidth="md" className={classes.root}>
				<Grid container className={classes.scrollerParent}>
					<Grid item xs={12}>
						<Typography variant="h4" className={classes.title}>
                            Artist List
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
									...resp.artists
								]);
								setPageEnd(resp.pages.nextPage !== null);
								setNextPage(resp.links.nextPage);
							});
							setPage(page + 1);
						}}
					>
						<TableContainer component={Paper}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>
                                            アーティスト名
										</TableCell>
										<TableCell className={classes.countTableHead}>
                                            収録曲数
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{
										listItems.map(item => (
											<TableRow key={'artist-' + item.id}>
												<TableCell key="artistName">
													<Link href={`/artist?id=${item.id}`} as={`/artist/${item.id}`}><a>{item.artist}</a></Link>
												</TableCell>
												<TableCell key="artistSongCount">
													{item.song_count}
												</TableCell>
											</TableRow>
										))
									}
								</TableBody>
							</Table>
						</TableContainer>
					</InfiniteScroll>
				</Grid>
			</Container>
		</div>
	);
};

App.propTypes = {
	setCueList: PropTypes.func,
	songList: PropTypes.array,
	artistList: PropTypes.array,
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
	artistList: [],
	queryNextPage: '',
	queryPageEnd: true,
	cueList: [],
	cueIndex: 0,
	id: null
};

const mapStateToProps = state => {
	return {
		...state.song,
		...state.artist,
		...state.auth,
		...state.player,
		...state.query
	};
};

const mapDispatchToProps = dispatch => {
	return {
		updateSong: songData => dispatch(songModule.update(songData)),
		updateArtist: artistData => dispatch(artistModule.update(artistData)),
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
		target: 'artist'
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

