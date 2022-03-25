import { CodecType, FormatType } from '../enums'

function format(name: string | FormatType): string {
    let syntax = {
        [FormatType.MKV]: 'matroska',
        [FormatType.M4A]: 'mp4'
    }
    return syntax[name] ?? name;
}

function codec(name: string | CodecType): string {
    let syntax = {
        [CodecType.AVC]: 'libx264',
        [CodecType.HEVC]: 'h265',
        [CodecType.OPUS]: 'libopus',
        [CodecType.AAC]: 'aac',
    }
    return syntax[name] ?? name;
}

export default { format, codec }