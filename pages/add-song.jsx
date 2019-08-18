import React, {useState, useEffect, useRef} from 'react';
import {Grid, Snackbar, Button, TextField, Typography, Table, TableBody, TableCell, TableHead, TableRow} from '@material-ui/core';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/styles';
import BPromise from 'bluebird';

const useStyles = makeStyles(theme => ({
	root: {
		marginTop: theme.spacing(3)
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

	useEffect(() => {
		fetch('/api/v1/song/continue/list').then(x => x.json()).then(resp => {
			if (resp.data.length === 0) {
				return;
			}

			if (uploadFileList.length > 0 && resp.data.filter(x => uploadFileList.findIndex(y => y.data.title === x.title) < 0).length === 0) {
				return;
			}

			if (resp.status === 'error') {
				setUploadFileList(array => [
					...array,
					{
						status: 'Error',
						message: resp.message,
						data: {
							title: resp.message
						}
					}
				]);
			}

			if (resp.status === 'success') {
				resp.data.forEach(respData => {
					setUploadFileList(array => [
						...array,
						{
							status: 'Continue',
							message: resp.message,
							data: respData
						}
					]);
				});
			}
		});
	}, [uploadFileList]);

	const fileButtonOnChange = e => {
		BPromise.map(e.target.files, file => {
			const formData = new FormData();
			formData.append('file', file);
			return fetch('/api/v1/song', {
				method: 'POST',
				body: formData
			}).then(x => x.json()).then(resp => {
				if (resp.status === 'error') {
					setUploadFileList(array => [
						...array,
						{
							fileName: file.name,
							status: 'Error',
							message: resp.message,
							data: {
								title: resp.message
							}
						}
					]);
				}

				if (resp.status === 'warning') {
					const continueError = new Error('continue');
					continueError.code = 'continue';
					continueError.continueID = resp.id;
					throw continueError;
				}

				if (resp.status === 'created') {
					setUploadFileList(array => [
						...array,
						{
							fileName: file.name,
							status: 'Continue',
							message: resp.message,
							data: resp.data
						}
					]);
				}

				if (resp.status === 'success') {
					setUploadFileList(array => [
						...array,
						{
							fileName: file.name,
							status: 'Update',
							message: resp.message,
							data: resp.data
						}
					]);
				}
			}).catch(error => {
				if (error.code === 'continue') {
					return fetch(`/api/v1/song/meta/${error.continueID}`).then(x => x.json()).then(resp => {
						if (resp.status === 'error') {
							setUploadFileList(array => [
								...array,
								{
									fileName: file.name,
									status: 'Error',
									message: resp.message,
									data: {
										title: resp.message
									}
								}
							]);
						}

						if (resp.status === 'success') {
							setUploadFileList(array => [
								...array,
								{
									fileName: file.name,
									status: 'Continue',
									message: resp.message,
									data: resp.data
								}
							]);
						}
					});
				}
			});
		}, {concurrency: 1});
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
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>Song ID</TableCell>
						<TableCell align="right">Title/Message</TableCell>
						<TableCell align="right">Album Name</TableCell>
						<TableCell align="right">Artist Name</TableCell>
						<TableCell align="right">Status</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{uploadFileList.map(row => (
						<SongTableRow key={row.title} row={row} setSnackMessage={setSnackMessage} setOpen={setOpen}/>
					))}
				</TableBody>
			</Table>
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
	if (row.status === 'Error') {
		return (
			<TableRow>
				<TableCell component="th" scope="row"/>
				<TableCell align="right">{title}</TableCell>
				<TableCell align="right"/>
				<TableCell align="right"/>
				<TableCell align="right">{status}</TableCell>
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
