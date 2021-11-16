import Bull, { Queue, Job, JobStatusClean } from 'bull';
import chalk from 'chalk';
import log from '../log';
import fs from 'fs';
import JobService from './job';
import { Status } from '../common/consts';

export default class TranscoderService {
    private mainQueue: Queue<any>;

    constructor() {
        this.mainQueue = new Bull('transcoder');
        this.initQueue(this.mainQueue);
    }

    private async clearQueue(queue: Queue<any>): Promise<void> {
        let jobStatusCleanList = ['completed', 'wait', 'active', 'delayed', 'failed'];
        jobStatusCleanList.forEach(async (v: JobStatusClean) => await queue.clean(0, v))
        await queue.removeJobs('*');
    }

    private async initQueue(queue: Queue<any>): Promise<Queue<any>> {
        function logEventBase(message, logger, color) {
            logger('transcoder', message)
        }
        function logInfo(message) {
            logEventBase(message, log.info, chalk.green)
        }
        function logWarn(message) {
            logEventBase(message, log.warn, chalk.yellow)
        }
        function logFail(message) {
            logEventBase(message, log.error, chalk.red)
        }
        return queue
            .on('error', function (error) {
                logFail(`An error ocurred: ${error}`)
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
                logInfo(`Job ${job.id} is ${progress * 100}% completed`)
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
                    logWarn(`No ${type} jobs to remove`)
                } else {
                    logWarn(`The following ${type} jobs were removed: ${JSON.stringify(jobs)}`)
                }
            })
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
        this.mainQueue.process(async function (job, done) {
            let { jobId, iFile, oFile, params } = job.data;

            await JobService.updateStatus(jobId, Status.PROCESSING);

            function fakeProgress(intervalMs = 1000) {
                let progress = 0;
                let timer = setInterval(async () => {
                    if (progress < 100) {
                        job.progress(progress / 100)
                        progress += 10;
                    } else {
                        await fs.promises.copyFile(iFile, oFile);
                        await JobService.updateStatus(jobId, Status.SUCCEDED);
                        done();
                        clearInterval(timer);
                    }
                }, intervalMs);
            }

            // TODO: Replace by ffmpeg
            fakeProgress(500)
        })
    }
}