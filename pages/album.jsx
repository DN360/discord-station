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
		if (id === null) {
			fetch('/api/v1/album?count=60').then(x => x.json()).then(resp => {
				setListItems(resp.albums);
				setNextPage(resp.links.nextPage);
				setPageEnd(resp.pages.nextPage !== null);
			});
		} else {
			fetch(`/api/v1/song?count=60&albumid=${id}`).then(x => x.json()).then(resp => {
				setListItems(resp.songs);
				setNextPage(resp.links.nextPage);
				setPageEnd(resp.pages.nextPage !== null);
			});
		}
	}, [id]);

	useEffect(() => {
		if (id === null) {
			setListItems(props.albumList);
		} else {
			setListItems(props.songList);
		}
	}, [id, props.albumList, props.songList]);

	useEffect(() => {
		setNextPage(props.queryNextPage);
		setPageEnd(props.queryPageEnd);
	}, [props.queryNextPage, props.queryPageEnd]);

	const cardOnClick = songData => {
		props.setCueList(listItems, listItems.findIndex(x => x.id === songData.id));
		props.play();
	};

	if (id === null) {
		// ターゲットのリストを表示する
		return (
			<div>
				<Container maxWidth="md" className={classes.root}>
					<Grid container className={classes.scrollerParent}>
						<Grid item xs={12}>
							<Typography variant="h4" className={classes.title}>
                                Album List
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
							<TableContainer component={Paper}>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>
                                                アルバム名
											</TableCell>
											<TableCell className={classes.countTableHead}>
                                                収録曲数
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{
											listItems.map(item => (
												<TableRow key={'album-' + item.id}>
													<TableCell key="albumName">
														<Link href={`/album?id=${item.id}`} as={`/album/${item.id}`}><a>{item.album}</a></Link>
													</TableCell>
													<TableCell key="albumSongCount">
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
	}
	// IDで絞った曲を表示する

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
								<SongCard key={'song-' + song.id} song={song} cardOnClick={cardOnClick} isPlaying={song.id === playingId}/>
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
		id: Number(query.id) || null,
		target: Number(query.id) ? 'song' : 'album',
		extraSearchQuery: Number(query.id) ? `albumid=${query.id}` : ''
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

