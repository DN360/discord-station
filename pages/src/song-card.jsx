import React, {useState} from 'react';
import {Grid, Typography, Tooltip, Menu, MenuItem} from '@material-ui/core';
import PropType from 'prop-types';
import Router from 'next/router';
import {makeStyles} from '@material-ui/styles';
import {PlayCircleFilledWhiteOutlined} from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
	songPicture: {
		width: '100%'
	},
	songCard: {
		padding: theme.spacing(2),
		cursor: 'pointer'
	},
	playingIcon: {
		position: 'absolute',
		fontSize: '3em',
		color: 'white',
		mixBlendMode: 'difference'
	}
}));

const initialMouseState = {
	mouseX: null,
	mouseY: null
};

const SongCard = props => {
	const classes = useStyles();
	const {song} = props;
	const [songData] = useState(song);
	const [mouseState, setMouseState] = useState(initialMouseState);
	const [contextClick, setContextClick] = useState(false);

	const handleClick = event => {
		event.preventDefault();
		setMouseState({
			mouseX: event.clientX - 2,
			mouseY: event.clientY - 4
		});
		setContextClick(true);
		return false;
	};

	const handleClose = () => {
		setMouseState(initialMouseState);
		setContextClick(true);
	};

	return (
		<Grid item xs={6} sm={4}
			md={3}

			className={classes.songCard} onClick={e => {
				if (contextClick) {
					setContextClick(false);
				} else {
					props.cardOnClick(songData, e);
				}
			}}
			onContextMenu={handleClick}
		>
			<Grid container>
				<Grid key="song-card-image" item xs={12} onContextMenu={handleClick}>
					{props.isPlaying ? (
						<PlayCircleFilledWhiteOutlined className={classes.playingIcon}/>
					) : ''}
					<img className={classes.songPicture} src={songData.pic_id === null || songData.pic_id === undefined ? '/assets/img/noimage.png' : `/api/v1/pic/${songData.pic_id}`}/>
				</Grid>
				<Grid key="song-card-title" item xs={12}>
					<Tooltip title={songData.title}>
						<Typography noWrap align="center" variant="h6" display="block">{songData.title}</Typography>
					</Tooltip>
				</Grid>
				<Grid key="song-card-artistname" item xs={12}>
					<Tooltip title={songData.artist}>
						<Typography noWrap align="center" variant="caption" display="block">{songData.artist}</Typography>
					</Tooltip>
				</Grid>
				<Grid key="song-card-albumname" item xs={12}>
					<Tooltip title={songData.album}>
						<Typography noWrap align="center" variant="caption" display="block">{songData.album}</Typography>
					</Tooltip>
				</Grid>
			</Grid>
			<Menu
				keepMounted
				open={mouseState.mouseY !== null}
				anchorReference="anchorPosition"
				anchorPosition={
					mouseState.mouseY !== null && mouseState.mouseX !== null ? {top: mouseState.mouseY, left: mouseState.mouseX} : undefined
				}
				onClose={handleClose}
			>
				<MenuItem onClick={() => {
					handleClose();
					Router.push(`/album/?id=${songData.album_id}`, `/album/${songData.album_id}`);
				}}
				>Goto this album list
				</MenuItem>
				<MenuItem onClick={() => {
					handleClose();
					Router.push(`/artist/?id=${songData.artist_id}`, `/artist/${songData.artist_id}`);
				}}
				>Goto this artist list
				</MenuItem>
			</Menu>
		</Grid>
	);
};

SongCard.propTypes = {
	song: PropType.object,
	cardOnClick: PropType.func.isRequired,
	isPlaying: PropType.bool
};

SongCard.defaultProps = {
	song: {},
	isPlaying: false
};

export default SongCard;
