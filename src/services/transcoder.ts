import Bull, { Job, JobStatusClean, Queue } from 'bull';
import fs from 'fs';
import { logFixedPrefix } from '../log';
import {
    Transcoder,
    TranscoderEvents,
    TranscoderFactory
} from '../common/media/transcoder';
import JobService from './job';
import { Status } from '../common/consts';

const log = logFixedPrefix('trascoder_service');

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
                log.error(`An error ocurred: ${error}`);
            })
            .on('waiting', function (jobId) {
                log.warn(`Job ${jobId} is waiting to be processed`)
            })
            .on('active', function (job, jobPromise) {
                log.warn(`Job ${job.id} is active`)
            })
            .on('stalled', function (job) {
                log.warn(`Job ${job.id} is stalled`)
            })
            .on('completed', function (job, result) {
                log.info(`Job ${job.id} is completed. Result: ${JSON.stringify(result)}`)
            })
            .on('progress', function (job, progress) {
                log.info(`Job ${job.id} is ${progress}% completed`)
            })
            .on('failed', function (job, err) {
                log.error(`Job ${job.id} failed: ${err.message}`)
            })
            .on('removed', function (job) {
                log.warn(`Job ${job.id} removed`)
            })
            .on('resumed', function (job) {
                log.warn(`Job ${job.id} resumed`)
            })
            .on('paused', function () {
                log.warn(`Queue paused`)
            })
            .on('drained', function (queue) {
                log.warn(`Queue drained`)
            })
            .on('cleaned', function (jobs, type) {
                if (jobs.length === 0) {
                    log.warn(`No ${type} jobs to remove`)
                } else {
                    log.warn(`The following ${type} jobs were removed: ${JSON.stringify(jobs)}`)
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
                        log.info(`Process started for job ${job.id}`);
                    })
                    .on(TranscoderEvents.FAILED, () => {
                        this.notifyJobFinish(jobId, Status.FAILED);
                        log.info(`Process failed for job ${job.id}`);
                        done();
                    })
                    .on(TranscoderEvents.FINISHED, () => {
                        this.notifyJobFinish(jobId, Status.SUCCEDED);
                        log.info(`Process finished for job ${job.id}`);
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