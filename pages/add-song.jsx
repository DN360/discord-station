/* eslint max-nested-callbacks: OFF */
import React, {useState, useEffect, useRef} from 'react';
import {Paper, Grid, Snackbar, Button, TextField, Typography, Table, TableContainer, TableBody, TableCell, TableHead, TableRow} from '@material-ui/core';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/styles';
import BPromise from 'bluebird';

const useStyles = makeStyles(theme => ({
	root: {
		marginTop: theme.spacing(3)
	},
	paper: {
		maxHeight: '370px'
	},
	table: {
		minWidth: '650px'
	}
}));

const AddSong = () => {
	const classes = useStyles();
	const [uploadFileList, setUploadFileList] = useState([]);
	const [snackMessage, setSnackMessage] = useState('');
	const [open, setOpen] = React.useState(false);

	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}

		setOpen(false);
	};

	// UpdateUploadFileListを叩き、更新されたあとに必ず実行される関数
	useEffect(() => {
		// Uploadingがなかったらreturn
		if (uploadFileList.filter(d => d.status === 'Uploading').length === 0) {
			return;
		}

		// 一旦UploadingをSendingに変えることで無限ループ回避
		setUploadFileList(array => array.map(d => d.status === 'Uploading' ? {
			...d,
			status: 'Sending'
		} : d));

		const fetchFiles = uploadFileList.filter(d => d.status === 'Uploading');

		BPromise.map(fetchFiles, uploadingFile => {
			const {file, uuid} = uploadingFile;
			const formData = new FormData();
			formData.append('file', file);
			return fetch('/api/v1/song', {
				method: 'POST',
				body: formData
			}).then(x => x.json()).then(resp => {
				if (resp.status === 'error') {
					setUploadFileList(array => array.map(d => d.uuid === uuid ? {
						fileName: file.name,
						status: 'Error',
						message: resp.message,
						data: {
							title: file.name,
							album: resp.message
						},
						uuid
					} : d));
				}

				if (resp.status === 'warning') {
					const continueError = new Error('continue');
					continueError.code = 'continue';
					continueError.continueID = resp.id;
					throw continueError;
				}

				if (resp.status === 'created') {
					setUploadFileList(array => array.map(d => d.uuid === uuid ? {
						fileName: file.name,
						status: 'Continue',
						message: resp.message,
						data: resp.data,
						uuid
					} : d));
				}

				if (resp.status === 'success') {
					setUploadFileList(array => array.map(d => d.uuid === uuid ? {
						fileName: file.name,
						status: 'Update',
						message: resp.message,
						data: resp.data,
						uuid
					} : d));
				}
			});
		}, {concurrency: 1});
	}, [uploadFileList]);

	const fileButtonOnChange = e => {
		const uuid = Date.now();
		const updatingFiles = [...e.target.files].map((file, i) => ({
			fileName: file.name,
			file,
			status: 'Uploading',
			data: {
				title: file.name
			},
			uuid: uuid + i
		}));
		setUploadFileList(array => [...array, ...updatingFiles]);
	};

	return (
		<Grid container className={classes.root}>
			<Grid item xs={12}>
				<Typography variant="caption">
                    To upload songs, click button below.
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<input multiple type="file" accept="audio/*" onChange={fileButtonOnChange}/>
			</Grid>
			<TableContainer component={Paper} className={classes.paper}>
				<Table size="small" className={classes.table}>
					<TableHead>
						<TableRow>
							<TableCell>Song ID</TableCell>
							<TableCell align="right">Title</TableCell>
							<TableCell align="right">Album Name/Message</TableCell>
							<TableCell align="right">Artist Name</TableCell>
							<TableCell align="right">Status</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{uploadFileList.map(row => (
							<SongTableRow key={row.data.title} row={row} setSnackMessage={setSnackMessage} setOpen={setOpen}/>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left'
				}}
				open={open}
				autoHideDuration={3000}
				ContentProps={{
					'aria-describedby': 'message-id'
				}}
				message={<span id="message-id">{snackMessage}</span>}
				onClose={handleClose}
			/>
		</Grid>
	);
};

const SongTableRow = props => {
	const {row, setSnackMessage, setOpen} = props;
	const titleRef = useRef(null);
	const albumRef = useRef(null);
	const artistRef = useRef(null);
	const [title, setTitle] = useState(row.data.title);
	const [album, setAlbum] = useState(row.data.album);
	const [artist, setArtist] = useState(row.data.artist);
	const [status, setStatus] = useState(row.status);
	if (row.status === 'Error' || row.status === 'Uploading') {
		return (
			<TableRow>
				<TableCell component="th" scope="row"/>
				<TableCell align="right">{row.data.title}</TableCell>
				<TableCell align="right">{row.data.album}</TableCell>
				<TableCell align="right"/>
				<TableCell align="right">{row.status}</TableCell>
			</TableRow>
		);
	}

	const uploadOrContinueButtonOnClick = () => {
		const targetID = row.song_id || row.data.id;
		const formData = new FormData();
		formData.append('title', title);
		formData.append('album', album);
		formData.append('artist', artist);
		if (row.status === 'Continue') {
			fetch(`/api/v1/song/${targetID}`, {
				method: 'PATCH',
				body: formData
			}).then(x => x.json).then(resp => {
				if (resp.status === 'error') {
					setSnackMessage('Patch Error, ' + resp.message);
				} else {
					setSnackMessage('Patch Successfully');
					setStatus('Update');
				}
			});
		} else if (row.status === 'Update') {
			fetch(`/api/v1/song/${targetID}`, {
				method: 'PUT',
				body: formData
			}).then(x => x.json).then(resp => {
				if (resp.status === 'error') {
					setSnackMessage('Update Error, ' + resp.message);
				} else {
					setSnackMessage('Update Successfully');
				}
			});
		}
	};

	return (
		<TableRow>
			<TableCell component="th" scope="row">
				{row.song_id || row.data.id}
			</TableCell>
			<TableCell align="right"><TextField ref={titleRef} value={title} onChange={e => {
				setTitle(e.target.value);
			}}/>
			</TableCell>
			<TableCell align="right"><TextField ref={albumRef} value={album} onChange={e => {
				setAlbum(e.target.value);
			}}/>
			</TableCell>
			<TableCell align="right"><TextField ref={artistRef} value={artist} onChange={e => {
				setArtist(e.target.value);
			}}/>
			</TableCell>
			<TableCell align="right"><Button variant="contained" color={status === 'Upload' ? 'inherit' : 'default'} onClick={uploadOrContinueButtonOnClick}>{status}</Button></TableCell>
		</TableRow>
	);
};

SongTableRow.propTypes = {
	row: PropTypes.object.isRequired,
	setSnackMessage: PropTypes.func.isRequired,
	setOpen: PropTypes.func.isRequired
};

export default AddSong;
