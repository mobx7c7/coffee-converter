import {
    DataType,
    CodecType,
    FormatType,
    CategoryType,
    ParameterType,
} from './enums'

export interface ParameterInfo {
    name: string,
    dataType: DataType
}

export interface CategoryInfo {
    formats: FormatType[],
    parameters: ParameterType[],
}

export interface FormatInfo {
    category: CategoryType,
    codecs?: {
        audio?: CodecType[],
        video?: CodecType[],
        image?: CodecType[],
    },
    extension?: string,
}

const ParameterRegs: { [key: string]: ParameterInfo } = {
    [ParameterType.FORMAT]: {
        name: 'format',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.CODEC]: {
        name: 'codec',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.PROFILE]: {
        name: 'profile',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.QUALITY]: {
        name: 'quality',
        dataType: DataType.INT_LIST,
    },
    [ParameterType.BITRATE]: {
        name: 'bitrate',
        dataType: DataType.INT_LIST,
    },
    [ParameterType.BITDEPTH]: {
        name: 'bitdepth',
        dataType: DataType.INT_LIST,
    },
    [ParameterType.SAMPLE_RATE]: {
        name: 'sample_rate',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.SAMPLE_FORMAT]: {
        name: 'sample_format',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.CHANNEL_COUNT]: {
        name: 'channel_count',
        dataType: DataType.INT,
    },
    [ParameterType.CHANNEL_FORMAT]: {
        name: 'channel_format',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.COMPRESSION_LEVEL]: {
        name: 'compression_level',
        dataType: DataType.INT_RANGE,
    },
    [ParameterType.WIDTH]: {
        name: 'width',
        dataType: DataType.INT,
    },
    [ParameterType.HEIGHT]: {
        name: 'height',
        dataType: DataType.INT,
    },
    [ParameterType.PIXEL_FORMAT]: {
        name: 'pixel_format',
        dataType: DataType.STR_LIST,
    },
    [ParameterType.FRAMES_PER_SECOND]: {
        name: 'frames_per_second',
        dataType: DataType.FLT_LIST,
    },
}

const CategoryRegs: { [key: string]: CategoryInfo } = {
    [CategoryType.AUDIO]: {
        formats: [
            FormatType.MP3,
            FormatType.M4A,
            FormatType.OGG,
            FormatType.OPUS,
            FormatType.FLAC,
            FormatType.WAV,
        ],
        parameters: [
            ParameterType.CODEC,
            ParameterType.PROFILE,
            ParameterType.BITRATE,
            ParameterType.BITDEPTH,
            ParameterType.SAMPLE_RATE,
            ParameterType.SAMPLE_FORMAT,
            ParameterType.CHANNEL_COUNT,
            ParameterType.CHANNEL_FORMAT,
            ParameterType.COMPRESSION_LEVEL,
        ]
    },
    [CategoryType.VIDEO]: {
        formats: [
            FormatType.MP4,
            FormatType.MOV,
            FormatType.MKV,
            FormatType.WEBM,
        ],
        parameters: [
            ParameterType.CODEC,
            ParameterType.PROFILE,
            ParameterType.BITRATE,
            ParameterType.WIDTH,
            ParameterType.HEIGHT,
            ParameterType.PIXEL_FORMAT,
            ParameterType.FRAMES_PER_SECOND,
        ]
    },
    [CategoryType.IMAGE]: {
        formats: [
            FormatType.GIF,
            FormatType.PNG,
            FormatType.JPG,
            FormatType.WEBP,
        ],
        parameters: [
            ParameterType.CODEC,
            ParameterType.PROFILE,
            ParameterType.QUALITY,
            ParameterType.WIDTH,
            ParameterType.HEIGHT,
            ParameterType.PIXEL_FORMAT,
            ParameterType.FRAMES_PER_SECOND, // gif
        ]
    },
}

const FormatRegs: { [key: string]: FormatInfo } = {
    [FormatType.MP3]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.MP3
            ]
        }
    },
    [FormatType.M4A]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.AAC
            ],
        }
    },
    [FormatType.MP4]: {
        category: CategoryType.VIDEO,
        codecs: {
            audio: [
                CodecType.AAC
            ],
            video: [
                CodecType.AVC,
                CodecType.HEVC
            ]
        }
    },
    [FormatType.MOV]: {
        category: CategoryType.VIDEO,
        codecs: {
            audio: [
                CodecType.AAC
            ],
            video: [
                CodecType.AVC,
                CodecType.HEVC,
            ]
        }
    },
    [FormatType.OGG]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.OPUS,
                CodecType.VORBIS
            ]
        }
    },
    [FormatType.OPUS]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.OPUS
            ]
        }
    },
    [FormatType.WAV]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.PCM
            ]
        }
    },
    [FormatType.FLAC]: {
        category: CategoryType.AUDIO,
        codecs: {
            audio: [
                CodecType.FLAC
            ]
        }
    },
    [FormatType.MKV]: {
        category: CategoryType.VIDEO,
        codecs: {
            audio: [
                CodecType.MP3,
                CodecType.AAC,
                CodecType.OPUS,
                CodecType.VORBIS,
                CodecType.FLAC,
                CodecType.PCM
            ],
            video: [
                CodecType.AVC,
                CodecType.HEVC,
                CodecType.VP9
            ]
        }
    },
    [FormatType.GIF]: {
        category: CategoryType.IMAGE,
        codecs: {
            image: [
                CodecType.GIF
            ]
        }
    },
    [FormatType.PNG]: {
        category: CategoryType.IMAGE,
        codecs: {
            image: [
                CodecType.PNG
            ]
        }
    },
    [FormatType.JPG]: {
        category: CategoryType.IMAGE,
        codecs: {
            image: [
                CodecType.JPG
            ]
        }
    },
    [FormatType.WEBM]: {
        category: CategoryType.VIDEO,
        codecs: {
            audio: [
                CodecType.OPUS
            ],
            video: [
                CodecType.VP9
            ]
        }
    },
    [FormatType.WEBP]: {
        category: CategoryType.IMAGE,
        codecs: {
            image: [
                CodecType.WEBP
            ]
        }
    },
}

export interface TranscoderCapability {
    Parameter(name: string | ParameterType): ParameterInfo;
    Category(name: string | CategoryType): CategoryInfo;
    Format(name: string | FormatType): FormatInfo;
}

const Capability: TranscoderCapability = {
    Parameter: (name) => ParameterRegs[name],
    Category: (name) => CategoryRegs[name],
    Format: (name) => FormatRegs[name],
}

export default Capability