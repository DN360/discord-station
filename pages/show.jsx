import React, {useState, useEffect, useRef} from 'react';
import PropType from 'prop-types';
import Router from 'next/router';
import {makeStyles} from '@material-ui/styles';
import {Grid, Typography, Container, TextField, Button, Snackbar} from '@material-ui/core';
import {Autocomplete} from '@material-ui/lab'

const useStyles = makeStyles(theme => ({
	root: {
		margin: 'auto',
		marginBottom: 130
	},
	title: {
		marginTop: theme.spacing(2)
    },
    albumPic: {
        display: 'block',
        width: '100%'
    },
    inputButton: {
        opacity: 0,
        appearance: 'none',
        position: 'absolute',
        display: 'block',
        width: '100%',
        height: '100%'
    },
    gridrow: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    }
}));

const App = props => {
	const classes = useStyles();
	const [songData, setSongData] = useState({});
	const [open, setOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    
    const [title, setTitle] = useState('');
    const [album, setAlbum] = useState('');
    const [artist, setArtist] = useState('');
    const [artistList, setArtistList] = useState([]);
    const [albumList, setAlbumList] = useState([]);
    const [pic, setPic] = useState('/assets/img/noimage.png')
    const searchUUID = useRef('')

    const {id} = props

    useEffect(() => {
        fetch(`/api/v1/song/meta/${id}`).then(x => x.json()).then(d => {
            if (d.status === 'error') {
                setSnackMessage(d.message)
                setOpen(true)
            } else {
                setSongData(d.data);
                setTitle(d.data.title);
                setAlbum(d.data.album);
                setArtist(d.data.artist);
                setArtistList([d.data.artist]);
                setAlbumList([d.data.album]);
                setPic(`/api/v1/pic/${d.data.pic_id}?${Date.now()}`)
            }
        })
    }, [id]);

    const fileReuploadButtonOnClick = e => {
        const {files} = e.target;
		if (!files || files.length === 0) {
			setSnackMessage('File canceled');
			setOpen(true);
			return;
		}

		const [file] = files;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('title', songData.title);
		formData.append('artist', songData.artist);
		formData.append('album', songData.album);
		fetch(`/api/v1/song/reupload/${id}`, {
			method: 'PUT',
			body: formData
		}).then(x => x.json()).then(resp => {
			if (resp.status === 'error') {
				setSnackMessage('Uploaded file is not valid music.');
				setOpen(true);
			} else {
				setSnackMessage('Song updated successfully.');
				setOpen(true);
				setTitle(resp.data.title);
				setAlbum(resp.data.album);
				setArtist(resp.data.artist);
				setPic(`/api/v1/pic/${resp.data.pic_id}?${Date.now()}`);
			}
		}).catch(error => {
			setSnackMessage('Cannot upload file.');
			setOpen(true);
			throw error;
		});
    }

	const fileUploadButtonOnClick = e => {
		const {files} = e.target;
		if (!files || files.length === 0) {
			setSnackMessage('File canceled');
			setOpen(true);
			return;
		}

		const [file] = files;

		if (!file.type.includes('image')) {
			setSnackMessage('Uploaded file is not valid image.');
			setOpen(true);
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		formData.append('title', songData.title);
		formData.append('artist', songData.artist);
		formData.append('album', songData.album);
		fetch(`/api/v1/song/${id}`, {
			method: 'PUT',
			body: formData
		}).then(x => x.json()).then(resp => {
			if (resp.status === 'error') {
				setSnackMessage('Uploaded file is not valid image.');
				setOpen(true);
			} else {
				setSnackMessage('Song picture updated successfully.');
				setOpen(true);
				setPic(`/api/v1/pic/${resp.data.pic_id}?${Date.now()}`);
			}
		}).catch(error => {
			setSnackMessage('Cannot upload file.');
			setOpen(true);
			throw error;
		});
    };

    const saveButtonOnClick = () => {
		const formData = new FormData();
		formData.append('title', title);
		formData.append('artist', artist);
		formData.append('album', album);
		fetch(`/api/v1/song/${id}`, {
			method: 'PUT',
			body: formData
		}).then(x => x.json()).then(resp => {
			if (resp.status === 'error') {
				setSnackMessage(d.message);
				setOpen(true);
			} else {
				setSnackMessage('Song data updated successfully.');
				setOpen(true);
			}
		}).catch(error => {
			setSnackMessage('Cannot update song.');
			setOpen(true);
			throw error;
		});
    }
    
    const searchArtist = (_e, value) => {
        setArtist(value)
        const uuid = Date.now()
        searchUUID.current = uuid
        setTimeout((q, sendUUID) => {
            if (sendUUID !== searchUUID.current) {
                return;
            }
            fetch(`/api/v1/artist/?count=60&q=${q}`).then(x => x.json()).then(d => {
                setArtistList(d.artists.map(x => x.artist))
            })
        }, 1000, value, uuid)
    }

    const searchAlbum = (_e, value) => {
        setAlbum(value)
        const uuid = Date.now()
        searchUUID.current = uuid
        setTimeout((q, sendUUID) => {
            if (sendUUID !== searchUUID.current) {
                return;
            }
            fetch(`/api/v1/album/?count=60&q=${q}`).then(x => x.json()).then(d => {
                setAlbumList(d.albums.map(x => x.album))
            })
        }, 1000, value, uuid)

    }

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<Container maxWidth="md" className={classes.root}>
			<Grid container>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h2" className={classes.title}>{(songData.title || 'loading...')}</Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                    <Grid container>
                        <Grid item xs={12}>
                            <img className={classes.albumPic} src={pic} />
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth color="secondary" variant="contained">
                            <input className={classes.inputButton} type="file" id="fileUploadButton" onChange={e => fileUploadButtonOnClick(e)}/>
                                Picture select...
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={10}>
                    <Grid container>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Song title" value={title} onChange={e => setTitle(e.target.value)} variant="outlined" />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                id="artist-autocomplete"
                                freeSolo
                                options={artistList}
                                value={artist}
                                onInputChange={searchArtist}
                                renderInput={params => (
                                    <TextField {...params} fullWidth label="Song Artist" value={artist} variant="outlined" />
                                )}/>
                        </Grid>
                        <Grid item xs={12}>
                            
                            <Autocomplete
                                id="artist-autocomplete"
                                freeSolo
                                options={albumList}
                                value={album}
                                onInputChange={searchAlbum}
                                renderInput={params => (
                                    <TextField {...params} fullWidth label="Song Album" value={album} variant="outlined" />
                                )}/>
                            
                        </Grid>
                    </Grid>
                </Grid>
                <Grid className={classes.gridrow} item xs={12}>
                    <Button fullWidth color="primary" variant="contained" onClick={saveButtonOnClick}>Save</Button>
                </Grid>
                <Grid className={classes.gridrow} item xs={12}>
                    <Button fullWidth color="secondary" variant="contained">
                        <input className={classes.inputButton} type="file" id="fileReuploadButton" onChange={e => fileReuploadButtonOnClick(e)}/>
                        Song file Reupload
                    </Button>
                </Grid>
                <Grid className={classes.gridrow} item xs={12}>
                    <Button fullWidth color="secondary" variant="contained" onClick={() => {
                        Router.push(`/api/v1/song/download/${songData.id}`);
    				}}>
                        Download song
                    </Button>
                </Grid>
                <Grid className={classes.gridrow} item xs={12}>
                    <Button fullWidth color="red" variant="contained" onClick={() => {
                        fetch(`/api/v1/song/${id}`, {
                            method: 'DELETE'
                        }).then(x => x.json()).then(resp => {
                            if (resp.status === 'error') {
                                setSnackMessage(d.message);
                                setOpen(true);
                            } else {
                                Router.back();
                            }
                        }).catch(error => {
                            setSnackMessage('Cannot delete song.');
                            setOpen(true);
                            throw error;
                        });
    				}}>
                        Delete song
                    </Button>
                </Grid>
			</Grid>
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
		</Container>
	);
};

App.propTypes = {
	id: PropType.number.isRequired
};

App.defaultProps = {
};


App.getInitialProps = ctx => {
	return {
        id: ctx.query.id
	};
};

export default App;
