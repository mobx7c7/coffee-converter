import { spawnSync } from 'child_process';
import { logFixedPrefix } from '../../../log';
import { Transcoder, TranscoderOpts } from '../transcoder'
import { Status } from '../../consts';
import FFmpegSyntax from './FFmpegSyntax'
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';

const log = logFixedPrefix('transcoder');

export class FFmpegTranscoder extends Transcoder {
    private command: ffmpeg.FfmpegCommand;

    constructor(iFile: string, oFile: string, oOpts: TranscoderOpts) {
        super(iFile, oFile);
        this.setup(oOpts);
    }

    private validateCommand() {
        if (!this.command)
            throw Error('transcoder not initialized');
    }

    private startCommand(): void {
        try {
            this.command
                .on('progress', (data) => {
                    this.notifyProgress(data)
                })
                .on('start', (cmd) => {
                    log.info(cmd);
                    this.notifyStarted();
                })
                .on('end', (stdout, stderr) => {
                    if (this.getStatus() == Status.PROCESSING) {
                        this.notifyFinished();
                    } else {
                        this.notifyError();
                    }
                })
                .on('error', (err) => {
                    log.error(err);
                    this.notifyError();
                })
                .on('stderr', function (strerr) {
                    log.verbose(strerr)
                })
            if (typeof this.getOutputFile() == 'string') {
                this.command.run()
            } else {
                this.command.pipe().on('data', this.notifyData)
            }
        } catch (error) {
            log.error(error);
        }
    }

    suspend(): void {
        this.validateCommand();
        // Send SIGSTOP to suspend ffmpeg
        this.command.kill('SIGSTOP');
    }

    resume(): void {
        this.validateCommand();
        // Send SIGCONT to resume ffmpeg
        this.command.kill('SIGCONT');
    }

    abort(): void {
        this.validateCommand();
        if (this.getStatus() == Status.PROCESSING) {
            this.notifyError(Status.ABORTED);
            // Workaround for non-working kill function.
            // Only for windows platform.
            if (os.platform() === 'win32') {
                try {
                    spawnSync('taskkill', ['/pid', this.command.ffmpegProc.pid, '/f', '/t']);
                } catch (e) {
                    console.error(e);
                }
            } else {
                this.command.kill('SIGKILL');
            }
        }
    }

    start(): void {
        this.validateCommand();
        if (this.getStatus() == Status.DEFAULT) {
            this.notifyStarted();
            ffmpeg.ffprobe(this.getInputFile(), (err, meta) => {
                if (err) {
                    log.error(err.message);
                    this.notifyError();
                } else {
                    this.startCommand();
                }
            });
        }
    }

    private initCommand(
        oOpts: TranscoderOpts
    ): void {
        let cmd = this.command = ffmpeg(this.getInputFile());
        let format = FFmpegSyntax.format(oOpts.format)

        cmd.inputOption('-hide_banner')
        cmd.format(format);
        cmd.output(this.getOutputFile())
        cmd.outputOption('-map_metadata -1')

        if (oOpts.stream.audio && !oOpts.stream.video) {
            // Audio files with embedded cover can be interpreted
            // as video file by ffmpeg. We have to reinforce it 
            // to use the first audio stream.
            cmd.outputOption('-map 0:0')
        }
    }

    private fillCmdAudioOutput(
        oOpts: TranscoderOpts
    ): void {
        let { audio } = oOpts.stream
        let cmd = this.command;
        if (audio.codec)
            cmd.audioCodec(FFmpegSyntax.codec(audio.codec));
        if (audio.channels)
            cmd.audioChannels(audio.channels);
        if (audio.sampleRate)
            cmd.audioFrequency(audio.sampleRate);
        if (audio.bitRate)
            cmd.audioBitrate(audio.bitRate);
    }

    private fillCmdVideoOutput(
        oOpts: TranscoderOpts
    ): void {
        let { video } = oOpts.stream
        let cmd = this.command;
        if (video.codec)
            cmd.videoCodec(FFmpegSyntax.codec(video.codec)); // E.g.: h264
        if (video.bitRate)
            cmd.videoBitrate(video.bitRate); // E.g.: 2M
        if (video.width && video.height)
            cmd.setSize(`${video.width}x${video.height}`);
    }

    private setup(
        oOpts: TranscoderOpts
    ): void {
        let { audio, video } = oOpts.stream
        this.initCommand(oOpts);
        if (audio)
            this.fillCmdAudioOutput(oOpts);
        if (video)
            this.fillCmdVideoOutput(oOpts);
    }
}
