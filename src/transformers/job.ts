export default function (input): any {
    return {
        id: input._id,
        status: input.status,
        title: input.title,
        //oFile: input.oFile,
        //batch: input.batch,
        createdAt: input.createdAt ?? null,
        startedAt: input.startedAt ?? undefined,
        finishedAt: input.finishedAt ?? undefined,
    }
}