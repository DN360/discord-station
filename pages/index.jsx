import React, {useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {makeStyles} from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import Router from 'next/router';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import {Typography} from '@material-ui/core';
import * as songModule from '../ducks/song';
import * as playerModule from '../ducks/player';
import SongCard from './src/song-card.jsx';

const useStyles = makeStyles(theme => ({
	root: {
		margin: theme.spacing(0)
	},
	title: {
		marginTop: theme.spacing(2)
	}
}));

const App = props => {
	const classes = useStyles();
	const [songs, setSongs] = useState(props.songList);
	useEffect(() => {
		fetch('/api/v1/song').then(x => x.json()).then(resp => {
			setSongs(resp.songs);
		});
	}, []);
	useEffect(() => {
		setSongs(props.songList);
	}, [props.songList]);

	const cardOnClick = songData => {
		props.play(songData);
	};

	return (
		<div>
			<Container maxWidth="md" className={classes.root}>
				<Grid container>
					<Grid item xs={12}>
						<Typography variant="h4" className={classes.title}>
							Recently uploaded song list.
						</Typography>
					</Grid>
					{songs ? songs.map(song => (
						<SongCard key={song.title} song={song} cardOnClick={cardOnClick}/>
					)) : (<Grid item>Loading...</Grid>)
					}
				</Grid>
			</Container>
		</div>
	);
};

App.propTypes = {
	updateSong: PropTypes.func,
	songList: PropTypes.array,
	play: PropTypes.func.isRequired
};

App.defaultProps = {
	updateSong: () => {},
	songList: []
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
		play: songData => dispatch(playerModule.play(songData))
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

