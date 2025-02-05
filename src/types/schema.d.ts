/**
 * Schema value
 */
type ISchemaValue =
    | { type: "string",     optional?: boolean, minLength?: number, maxLength?: number, label_reference?: boolean }
    | { type: "number",     optional?: boolean, min?: number, max?: number }
    | { type: "null",       optional?: boolean }
    | { type: "sentences",  optional?: boolean }
    | { type: "array",      optional?: boolean, content: ISchemaValue }
    | { type: "object",     optional?: boolean, content: ISchema }

/**
 * Schema object
 */
interface ISchema {
    [key: string]: ISchemaValue
}