/**
 * Schema value
 */
type ISchemaValue =
    | { type: "any",                optional?: boolean}
    | { type: "string",             optional?: boolean, name?: string,  minLength?: number, maxLength?: number, label_reference?: boolean }
    | { type: "number",             optional?: boolean, name?: string,  min?: number, max?: number }
    | { type: "boolean",            optional?: boolean, name?: string }
    | { type: "null",               optional?: boolean, name?: string, }
    | { type: "sentences",          optional?: boolean, name?: string, }
    | { type: "array",              optional?: boolean, name?: string,  content: ISchemaValue }
    | { type: "object",             optional?: boolean, name?: string,  content?: ISchema, value?: ISchemaValue, allow_dynamic_keys?: boolean }
    | { type: "alternatives",       optional?: boolean, name?: string,  schema: ISchemaValue[]}
    | { type: "reference",          optional?: boolean, reference_name: string}

/**
 * Schema object
 */
interface ISchema {
    [key: string]: ISchemaValue
}