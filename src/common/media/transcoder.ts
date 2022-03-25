import EventEmitter from 'events';
import { Status } from '../consts';

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

export interface TranscoderOpts {
    format?: string,
    stream?: {
        audio?: AudioStreamOpts,
        video?: VideoStreamOpts
    }
}

export interface AudioStreamOpts {
    codec?: string,
    bitRate?: string | number,
    channels?: number,
    sampleRate?: number,
    sampleFormat?: string,
}

export interface VideoStreamOpts {
    codec?: string,
    bitRate?: string | number,
    channels?: number,
    framesPerSecond?: number,
    pixelFormat?: number,
    width?: number,
    height?: number,
}

export class Transcoder {
    private eventEmitter: EventEmitter;
    private iFile: string;
    private oFile: string;
    private status: string;

    private notityEventBase(status: string, args?: any) {
        this.eventEmitter.emit(status, { transcoder: this, ...args });
    }

    protected constructor(iFile: string, oFile: string) {
        this.iFile = iFile;
        this.oFile = oFile;
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

    protected notifyFinished(): void {
        this.status = Status.SUCCEDED;
        this.notityEventBase(TranscoderEvents.FINISHED);
    }

    protected notifyError(status?: Status, message?: string): void {
        this.status = status ?? Status.FAILED;
        this.notityEventBase(TranscoderEvents.FAILED, { message: message });
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
        return this.iFile;
    }

    getOutputFile(): string {
        return this.oFile;
    }

    getStatus(): string {
        return this.status;
    }

    abort(): void { }

    start(): void { }
}