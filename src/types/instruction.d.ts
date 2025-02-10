/**
 * Possibles Json value 
 */
type IJsonValue = boolean | string | number | null | IJson | IJsonValue[];

/**
 * Structure data received from JSON
 */
interface IJson {
    /**
     * Possible JSON values
     */
    [key: string]: IJsonValue
}

/**
 * Instruction item
 */
type IIntruction = { script: string } & IJson;

/**
 * Tag reference
 */
type ILabel = string;

/**
 * Sentence JSON
 */
type ISentence = ILabel | IIntruction | ISentence[];