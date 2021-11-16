import JobTransformer from './job'

export default function (input): any {
    return {
        id: input._id,
        status: input.status,
        params: input.params,
        //userId: batch.userId, // must be hidden from public
        createdAt: input.createdAt ?? null,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
        jobs: input.jobs ? input.jobs.map(JobTransformer) : null
    }
}