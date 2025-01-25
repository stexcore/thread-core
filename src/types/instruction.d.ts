
/**
 * Structure data received from JSON
 */
interface IJson {
    /**
     * Possible JSON values
     */
    [key: string]: string | number | null | IJson | IJson[]
}

/**
 * Instruction item
 */
type IIntruction = { type: string } & IJson;

/**
 * Label reference
 */
type ILabel = string;

/**
 * Sentence JSON
 */
type ISentence = ILabel | IIntruction | IIntruction[];