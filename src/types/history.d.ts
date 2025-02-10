/**
 * History execution
 */
interface IHistoryItem_AddInstance {
    type: "add_instance",
    sentences: ISentence[],
    entry_label?: string
}