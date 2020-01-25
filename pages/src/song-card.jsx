import React, {useState} from 'react';
import {Grid, Typography, Tooltip} from '@material-ui/core';
import PropType from 'prop-types';
import {makeStyles} from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	songPicture: {
		width: '100%'
	},
	songCard: {
		padding: theme.spacing(2),
		cursor: 'pointer'
	}
}));

const SongCard = props => {
	const classes = useStyles();
	const {song} = props;
	const [songData] = useState(song);

	return (
		<Grid item xs={6} md={2}
			className={classes.songCard} onClick={e => {
				props.cardOnClick(songData, e);
			}}
		>
			<Grid container>
				<Grid item xs={12}>
					<img className={classes.songPicture} src={songData.pic_id === null || songData.pic_id === undefined ? '/assets/img/noimage.png' : `/api/v1/pic/${songData.pic_id}`}/>
				</Grid>
				<Grid item xs={12}>
					<Tooltip title={songData.title}>
						<Typography noWrap align="center" variant="h6" display="block">{props.isPlaying ? 'PLAY: ' : ''}{songData.title}</Typography>
					</Tooltip>
				</Grid>
				<Grid item xs={12}>
					<Tooltip title={songData.artist}>
						<Typography noWrap align="center" variant="caption" display="block">{songData.artist}</Typography>
					</Tooltip>
				</Grid>
				<Grid item xs={12}>
					<Tooltip title={songData.album}>
						<Typography noWrap align="center" variant="caption" display="block">{songData.album}</Typography>
					</Tooltip>
				</Grid>
			</Grid>
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
