import app from './app'
import log from './log'

const PORT = app.get('port');

app.listen(PORT, () => {
    console.clear()
    log.info('app', `Listening port ${PORT}`)
})