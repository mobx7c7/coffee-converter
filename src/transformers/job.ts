export default function (input): any {
    return {
        id: input._id,
        status: input.status,
        title: input.title,
        createdAt: input.createdAt ?? null,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
    }
}