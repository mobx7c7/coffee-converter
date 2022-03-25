import { Transcoder, TranscoderOpts } from './transcoder';
import { FFmpegTranscoder } from './impl/FFmpegTranscoder'

function CreateTranscoder(
    iFile: string,
    oFile: string,
    oOpts: TranscoderOpts
): Transcoder {
    return new FFmpegTranscoder(iFile, oFile, oOpts);
}

export default { CreateTranscoder }