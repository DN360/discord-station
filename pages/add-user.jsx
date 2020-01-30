import React, {useState} from "react";
import {makeStyles} from '@material-ui/styles';
import {Grid, Typography, Container, TextField, Button, Snackbar} from "@material-ui/core"

const useStyles = makeStyles(theme => ({
	root: {
		margin: 'auto',
		marginBottom: 130
	},
	title: {
		marginTop: theme.spacing(2)
	}
}));

const App = () => {
    const classes = useStyles();
    const [name, setName] = useState("");
    const [mail, setMail] = useState("");
    const [passwd, setPasswd] = useState("");
    const [open, setOpen] = useState(false)
    const [snackMessage, setSnackMessage] = useState("")

    const createButton_onClick = () => {
        fetch("/api/v1/user/", {
            method: "POST",
            body: JSON.stringify({
                username: name,
                email: mail,
                password: passwd
            }),
            headers: {
                'Content-Type': "application/json"
            }
        }).then(x => x.json()).then(d => {
            if (d.status === "error") {
                setSnackMessage(d.message)
                setOpen(true)
            } else {
                setSnackMessage(d.message)
                setOpen(true)
            }
        })
    }

    const handleClose = () => {
        setOpen(false);
    }

    return (
        <Container maxWidth="md" className={classes.root}>
            <Grid container>
                <Grid item xs={12}>
                    <Typography variant="h4" component="h2" className={classes.title}>New User</Typography>
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth label="UserID" id="userID" value={name} onChange={e => setName(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth type="email" label="Mail" id="mail" value={mail} onChange={e => setMail(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth type="password" label="Password" id="password" value={passwd} onChange={e => setPasswd(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                    <Button fullWidth variant="contained" color="primary" onClick={createButton_onClick}>Create</Button>
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
    )
}

App.getInitialProps = (ctx) => {
    return {

    }
}

export default App;