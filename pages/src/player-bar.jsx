import React, {useState, useEffect, useRef} from 'react';
import {connect} from 'react-redux';
import {makeStyles} from '@material-ui/styles';
import {AppBar, Toolbar, IconButton, Slider, Grid} from '@material-ui/core';
import {PlayArrowRounded, StopRounded, PauseRounded, SkipNextRounded, SkipPreviousRounded, RepeatRounded, ShuffleRounded} from '@material-ui/icons';
import PropTypes from 'prop-types';
import * as playerModule from '../../ducks/player';

const useStyles = makeStyles(theme => ({
	root: {
		flexGrow: 1,
		maxWidthXl: true
	},
	appBar: {
		top: 'auto',
		bottom: 0
	},
	sliderRoot: {
		[theme.breakpoints.up('md')]: {
			display: 'inherit'
		}, [theme.breakpoints.down('sm')]: {
			display: 'none'
		},
		width: '100%'
	},
	slider: {
		color: theme.palette.common.white
	},
	timeSpan: {
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1)
	},
	mdToolbar: {
		[theme.breakpoints.up('md')]: {
			display: 'none'
		}, [theme.breakpoints.down('sm')]: {
			display: 'inherit'
		}
	}
}));
const PlayerBar = props => {
	const classes = useStyles();
	const playerRef = useRef(null);
	const sourceRef = useRef(null);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [resumeMode, setResumeMode] = useState(false);
	useEffect(() => {
		if (props.player.status === playerModule.playerStatus.play || props.player.status === playerModule.playerStatus.replay) {
			sourceRef.current.src = `/api/v1/song/${props.player.cueList[props.player.cueIndex].id}`;
			playerRef.current.src = `/api/v1/song/${props.player.cueList[props.player.cueIndex].id}`;
			playerRef.current.play();
		}

		if (props.player.status === playerModule.playerStatus.replay) {
			playerRef.current.pause();
			playerRef.current.play();
		}

		if (props.player.status === playerModule.playerStatus.pause) {
			setCurrentTime(playerRef.current.currentTime);
			playerRef.current.pause();
			setResumeMode(true);
		}

		if (props.player.status === playerModule.playerStatus.stop) {
			setCurrentTime(0);
			playerRef.current.pause();
		}
	}, [props.player.cueIndex, props.player.cueList, props.player.status]);

	const sliderValueChange = player => {
		if (player.current !== null && player.current !== undefined) {
			setCurrentTime(player.current.currentTime);
			setTimeout(sliderValueChange, 100, player);
		}
	};

	const audioOnPlay = () => {
		if (resumeMode) {
			setResumeMode(false);
			playerRef.current.currentTime = currentTime;
		}
	};

	const audioOnLoadedData = () => {
		if (playerRef.current !== null && playerRef.current !== undefined) {
			setDuration(playerRef.current.duration);
			setTimeout(sliderValueChange, 100, playerRef);
		}
	};

	const audioOnEnded = () => {
		if (playerRef.current.duration - playerRef.current.currentTime <= 0) {
			if (props.player.repeat) {
				if (props.player.cueList.length === 1) {
					sliderOnChange(null, 0);
					playerRef.current.play();
					return;
				}
			}

			props.skipNext();
		}
	};

	const sliderOnChange = (e, value) => {
		if (value !== undefined) {
			playerRef.current.currentTime = value;
		}
	};

	const zp = (str, max = 2) => (new Array(max).fill(0).join('') + str).slice(-max);
	const secToTime = second => (sec => `${zp((sec - (sec % 60)) / 60)}:${zp(sec % 60)}`)(Number((String(second)).split('.')[0]));

	return (
		<div className={classes.root}>
			<AppBar color="secondary" className={classes.appBar} position="fixed">
				<Toolbar>
					{props.player.status === playerModule.playerStatus.play ? (
						<IconButton
							color="inherit"
							onClick={() => {
								props.pause();
							}}
						>
							<PauseRounded/>
						</IconButton>
					) : (
						<IconButton
							color="inherit"
							onClick={() => {
								props.play();
							}}
						>
							<PlayArrowRounded/>
						</IconButton>
					)}
					<IconButton
						color="inherit"
						onClick={() => {
							props.stop();
						}}
					>
						<StopRounded/>
					</IconButton>
					<IconButton
						color="inherit"
						onClick={() => {
							if (currentTime >= 1) {
								sliderOnChange(null, 0);
							} else {
								props.skipPrev();
							}
						}}
					>
						<SkipPreviousRounded/>
					</IconButton>
					<IconButton
						color="inherit"
						onClick={() => {
							props.skipNext();
						}}
					>
						<SkipNextRounded/>
					</IconButton>
					<IconButton
						color={props.player.repeat ? 'inherit' : 'default'}
						onClick={() => {
							props.repeat();
						}}
					>
						<RepeatRounded/>
					</IconButton>
					<IconButton
						color={props.player.shuffle ? 'inherit' : 'default'}
						onClick={() => {
							props.shuffle();
						}}
					>
						<ShuffleRounded/>
					</IconButton>
					<Grid className={classes.sliderRoot}>
						<span className={classes.timeSpan}>
							{secToTime(currentTime)}/{secToTime(duration)}
						</span>
						<Slider max={duration} className={classes.slider} value={currentTime} onChange={sliderOnChange}/>
					</Grid>
					<audio ref={playerRef} onPlay={audioOnPlay} onLoadedData={e => audioOnLoadedData(e)} onEnded={audioOnEnded}>
						<source ref={sourceRef}/>
					</audio>
				</Toolbar>
				<Toolbar className={classes.mdToolbar}>
					<span className={classes.timeSpan}>
						{secToTime(currentTime)}/{secToTime(duration)}
					</span>
					<Slider max={duration} className={classes.slider} value={currentTime} onChange={sliderOnChange}/>
				</Toolbar>
			</AppBar>
		</div>
	);
};

PlayerBar.propTypes = {
	player: PropTypes.object.isRequired,
	play: PropTypes.func.isRequired,
	pause: PropTypes.func.isRequired,
	stop: PropTypes.func.isRequired,
	skipNext: PropTypes.func.isRequired,
	skipPrev: PropTypes.func.isRequired,
	repeat: PropTypes.func.isRequired,
	shuffle: PropTypes.func.isRequired
};

const mapStateToProps = state => {
	return {
		...state.songs,
		player: state.player
	};
};

const mapDispatchToProps = dispatch => {
	return {
		play: songData => dispatch(playerModule.play(songData)),
		pause: () => dispatch(playerModule.pause()),
		stop: () => dispatch(playerModule.stop()),
		skipNext: () => dispatch(playerModule.skipNext()),
		skipPrev: () => dispatch(playerModule.skipPrev()),
		repeat: () => dispatch(playerModule.toggleRepeatMode()),
		shuffle: () => dispatch(playerModule.toggleShuffleMode())
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayerBar);
