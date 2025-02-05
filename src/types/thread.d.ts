/**
 * Initial settings thread
 */
interface IThreadConfig {
    vars?: IJson,
    sentences?: ISentence,
    entry_label?: ILabel
}

/**
 * Initial thread Core settings
 */
interface IThreadCoreConfig {
    thread?: IThreadConfig
}