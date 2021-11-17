import Bull, { Job, JobStatusClean, Queue } from 'bull';
import fs from 'fs';
import log from '../log';
import {
    Transcoder,
    TranscoderEvents,
    TranscoderFactory
} from '../common/media/transcoder';
import JobService from './job';
import { Status } from '../common/consts';

function logEventBase(
    logger: any,
    message: any,
): void {
    logger('transcoder_service', message);
}

function logInfo(
    message: string
): void {
    logEventBase(log.info, message);
}

function logWarn(
    message: string
): void {
    logEventBase(log.warn, message);
}

function logFail(
    message: string
): void {
    logEventBase(log.error, message);
}

interface TranscoderData {
    transcoder?: Transcoder;
    oStream?: fs.WriteStream;
}

export default class TranscoderService {
    private processes: TranscoderData[];
    private mainQueue: Queue<any>;

    constructor() {
        this.processes = [];
        this.mainQueue = new Bull('transcoder');
        this.initQueue(this.mainQueue);
    }

    protected async clearQueue(
        queue: Queue<any>
    ): Promise<void> {
        let jobStatusCleanList = ['completed', 'wait', 'active', 'delayed', 'failed'];
        jobStatusCleanList.forEach(async (v: JobStatusClean) => await queue.clean(0, v))
        await queue.removeJobs('*');
    }

    protected async initQueue(
        queue: Queue<any>
    ): Promise<Queue<any>> {
        return queue
            .on('error', function (error) {
                logFail(`An error ocurred: ${error}`);
            })
            .on('waiting', function (jobId) {
                logWarn(`Job ${jobId} is waiting to be processed`)
            })
            .on('active', function (job, jobPromise) {
                logWarn(`Job ${job.id} is active`)
            })
            .on('stalled', function (job) {
                logWarn(`Job ${job.id} is stalled`)
            })
            .on('completed', function (job, result) {
                logInfo(`Job ${job.id} is completed. Result: ${JSON.stringify(result)}`)
            })
            .on('progress', function (job, progress) {
                logInfo(`Job ${job.id} is ${progress}% completed`)
            })
            .on('failed', function (job, err) {
                logFail(`Job ${job.id} failed: ${err.message}`)
            })
            .on('removed', function (job) {
                logWarn(`Job ${job.id} removed`)
            })
            .on('resumed', function (job) {
                logWarn(`Job ${job.id} resumed`)
            })
            .on('paused', function () {
                logWarn(`Queue paused`)
            })
            .on('drained', function (queue) {
                logWarn(`Queue drained`)
            })
            .on('cleaned', function (jobs, type) {
                if (jobs.length === 0) {
                    this.logWarn(`No ${type} jobs to remove`)
                } else {
                    this.logWarn(`The following ${type} jobs were removed: ${JSON.stringify(jobs)}`)
                }
            })
    }

    protected async notifyJobStart(
        id: string,
        status: string
    ): Promise<any> {
        return await JobService.updateOne({
            id: id,
            input: {
                status: status,
                startedAt: new Date().toISOString()
            }
        });
    }

    protected async notifyJobFinish(
        id: string,
        status: string
    ): Promise<any> {
        await this.destroyProcess(id, status == Status.FAILED);
        return await JobService.updateOne({
            id: id,
            input: {
                status: status,
                finishedAt: new Date().toISOString()
            }
        });
    }

    protected async destroyProcess(
        jobId: string,
        errored = false
    ): Promise<void> {
        let process = this.processes[jobId];
        process.oStream.close();
        if (errored) {
            await fs.promises.unlink(process.oStream.path);
        }
        delete this.processes[jobId];
    }

    protected createProcess(
        jobId: string,
        iFile: string,
        oFile: string
    ): TranscoderData {
        let process = {
            oStream: fs.createWriteStream(oFile),
            transcoder: TranscoderFactory.audioFormat(iFile),
        }
        this.processes[jobId] = process;
        return process;
    }

    async getJobs(): Promise<Job<any>[]> {
        return await this.mainQueue.getJobs([]);
    }

    async clear(): Promise<void> {
        await this.clearQueue(this.mainQueue);
    }

    async add(input: any): Promise<void> {
        await this.mainQueue.add(input);
    }

    async process(): Promise<void> {
        this.mainQueue.process((job, done) => {
            try {
                let { jobId, iFile, oFile } = job.data;
                let process = this.createProcess(jobId, iFile, oFile);
                process.transcoder
                    .on(TranscoderEvents.PROGRESS, (e) => {
                        job.progress(e.progress.percent.toFixed());
                    })
                    .on(TranscoderEvents.STARTED, () => {
                        this.notifyJobStart(jobId, Status.PROCESSING);
                        logInfo(`Process started for job ${job.id}`);
                    })
                    .on(TranscoderEvents.FAILED, () => {
                        this.notifyJobFinish(jobId, Status.FAILED);
                        logInfo(`Process failed for job ${job.id}`);
                        done();
                    })
                    .on(TranscoderEvents.FINISHED, () => {
                        this.notifyJobFinish(jobId, Status.SUCCEDED);
                        logInfo(`Process finished for job ${job.id}`);
                        done();
                    })
                    .on(TranscoderEvents.DATA, (e) => {
                        process.oStream.write(e.chunk);
                    })
                    .start();
            } catch (error) {
                throw error;
            }
        })
    }
}