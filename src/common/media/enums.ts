export enum DataType {
    BOOL,
    INT,
    INT_LIST,
    INT_RANGE,
    FLT,
    FLT_LIST,
    FLT_RANGE,
    STR,
    STR_LIST,
}

export enum ParameterType {
    FORMAT, // aka container
    CODEC,
    PROFILE,
    QUALITY, // jpg, mp3
    BITRATE,
    BITDEPTH,
    SAMPLE_RATE, // hz
    SAMPLE_FORMAT,
    CHANNEL_COUNT,
    CHANNEL_FORMAT,
    COMPRESSION_LEVEL, // flac
    WIDTH,
    HEIGHT,
    PIXEL_FORMAT,
    FRAMES_PER_SECOND,
}

export enum CategoryType {
    AUDIO = 'audio',
    VIDEO = 'video',
    IMAGE = 'image',
}

export enum FormatType {
    NONE = 'none',
    MP3 = 'mp3',
    M4A = 'm4a',
    MP4 = 'mp4',
    MOV = 'mov',
    OGG = 'ogg',
    OPUS = 'opus',
    WAV = 'wav',
    FLAC = 'flac',
    MKV = 'mkv',
    WEBM = 'webm',
    WEBP = 'webp',
    GIF = 'gif',
    PNG = 'png',
    JPG = 'jpg',
}

export enum CodecType {
    // Audio
    MP3 = 'mp3',
    AAC = 'aac',
    PCM = 'pcm',
    FLAC = 'flac',
    OPUS = 'opus',
    VORBIS = 'vorbis',
    // Video
    VP8 = 'vp8',
    VP9 = 'vp9',
    AVC = 'avc', // aka H264
    HEVC = 'hevc', // aka H265
    // Image
    GIF = 'gif',
    JPG = 'jpg',
    PNG = 'png',
    WEBP = 'webp'
}
