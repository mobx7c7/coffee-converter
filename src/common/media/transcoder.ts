import EventEmitter from 'events';
import { Status } from '../consts';
import { spawnSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';

export enum TranscoderEvents {
    PROGRESS = 'progress',
    STARTED = 'started',
    FINISHED = 'finished',
    FAILED = 'failed',
    DATA = 'data',
}

export interface TranscoderEvent {
    transcoder?: Transcoder,
    progress?: any
    chunk?: Buffer
}

export class Transcoder {
    private eventEmitter: EventEmitter;
    private inputFile: string;
    private status: string;

    private notityEventBase(status: string, args?: any) {
        this.eventEmitter.emit(status, { transcoder: this, ...args });
    }

    protected constructor(inputFile: string) {
        this.inputFile = inputFile;
        this.eventEmitter = new EventEmitter();
        this.status = Status.DEFAULT;
    }

    protected notifyProgress(data: any): void {
        this.notityEventBase(TranscoderEvents.PROGRESS, { progress: data });
    }

    protected notifyStarted(): void {
        this.status = Status.PROCESSING;
        this.notityEventBase(TranscoderEvents.STARTED);
    }

    protected notifyFinished(status = Status.SUCCEDED): void {
        this.status = status;
        this.notityEventBase(TranscoderEvents.FINISHED);
    }

    protected notifyError(status = Status.FAILED): void {
        this.status = status;
        this.notityEventBase(TranscoderEvents.FAILED);
    }

    protected notifyData(chunk: any): void {
        this.notityEventBase(TranscoderEvents.DATA, { chunk: chunk });
    }

    on(
        event: TranscoderEvents,
        listener: (e: TranscoderEvent) => void
    ): Transcoder {
        this.eventEmitter.on(event, listener);
        return this;
    }

    getInputFile(): string {
        return this.inputFile;
    }

    getStatus(): string {
        return this.status;
    }

    abort(): void { }

    start(): void { }
}

class FFmpegTranscoder extends Transcoder {
    private command: ffmpeg.FfmpegCommand;

    constructor(inputFile: string) {
        super(inputFile);
    }

    private startCommand(): void {
        this.command
            .on('progress', (data) => {
                this.notifyProgress(data)
            })
            .on('start', (cmd) => {
                this.notifyStarted();
            })
            .on('end', () => {
                if (this.getStatus() == Status.PROCESSING) {
                    this.notifyFinished();
                } else {
                    this.notifyError();
                }
            })
            .on('error', (err) => {
                this.notifyError();
            });

        this.command.pipe().on('data', (chunk) => {
            this.notifyData(chunk);
        });
    }

    abort(): void {
        if (this.command && this.getStatus() == Status.PROCESSING) {
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
                this.command.kill();
            }
        }
    }

    start(): void {
        if (this.command && this.getStatus() == Status.DEFAULT) {
            this.notifyStarted();
            ffmpeg.ffprobe(this.getInputFile(), (err, meta) => {
                if (err) {
                    this.notifyError();
                } else {
                    this.startCommand();
                }
            });
        }
    }

    setupAudioFormatOutput(): void {
        let cmd = ffmpeg();
        cmd.input(this.getInputFile());
        cmd.noVideo();
        cmd.format('opus');
        cmd.audioBitrate(32);
        cmd.audioChannels(2);
        cmd.audioFrequency(48000);
        this.command = cmd;
    }
}

export const TranscoderFactory = {
    audioFormat: (inputFile: string) => {
        let transcoder = new FFmpegTranscoder(inputFile);
        transcoder.setupAudioFormatOutput();
        return transcoder;
    }
}