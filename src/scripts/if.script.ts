import { ThreadScript } from "../core/script";

/**
 * Where value base
 */
type IValueBase =
    | IValueBase[]
    | { [key: string]: IValueBase }
    | boolean
    | string
    | number
    | null;

/**
 * Where condition
 */
type IWhereCondition = {
    "@and":
        | IWhereCondition[]
        | IWhereCondition;
    "@or":
        | IWhereCondition[]
        | IWhereCondition;
    [key: string]: IValueBase
}

/**
 * Instruction interface
 */
interface IInstructionIfScript extends IJson {
    /**
     * Where condition
     */
    where: IWhereCondition,
    /**
     * Then sentences
     */
    then: ISentence,
    /**
     * Else sentences
     */
    else: ISentence
}

/**
 * Script If question
 */
export class IfScript extends ThreadScript<IInstructionIfScript> {

    /**
     * Schema to use to allow the execution script
     */
    public static schema: ISchema = {
        /**
         * Where question
         */
        where: { 
            name: "where_base",
            type: "object",
            allow_dynamic_keys: true,
            content: {
                "@and": {
                    type: "alternatives",
                    optional: true,
                    schema: [
                        {
                            type: "array",
                            content: {
                                type: "reference",
                                reference_name: "where_base"
                            }
                        },
                        {
                            type: "reference",
                            reference_name: "where_base"
                        }
                    ]
                },
                "@or": {
                    type: "alternatives",
                    optional: true,
                    schema: [
                        {
                            type: "array",
                            content: {
                                type: "reference",
                                reference_name: "where_base"
                            }
                        },
                        {
                            type: "reference",
                            reference_name: "where_base"
                        },
                    ]
                },
            },
            value: {
                name: "value_base",
                type: "alternatives",
                schema: [
                    {
                        type: "array",
                        content: {
                            type: "reference",
                            reference_name: "value_base"
                        }
                    },
                    {
                        type: "object",
                        allow_dynamic_keys: true,
                        value: {
                            type: "reference",
                            reference_name: "value_base"
                        }
                    },
                    {
                        type: "string"
                    },
                    {
                        type: "number"
                    },
                    {
                        type: "null"
                    },
                    {
                        type: "boolean"
                    }
                ]
            },
        },
        /**
         * Sentences
         */
        then: {
            type: "sentences",
        },
        /**
         * Else sentences
         */
        else: {
            type: "sentences",
            optional: true
        }
    }

    /**
     * Execute instruction
     */
    public async onExecute(): Promise<void> {
        const result = this.validateWhere(this.instruction.where, "and");
        
        if(result) {
            // Execute then sentences
            this.thread.execute(this.instruction.then);
        }
        else if(this.instruction.else) {
            // Execute else sentences
            this.thread.execute(this.instruction.else);
        }
    }

    /**
     * Validate where instruction
     * @param where Where condition
     * @param type Type condition
     * @returns Result comparation
     */
    public validateWhere(where: IWhereCondition | IWhereCondition[], type: "and" | "or"): boolean {
        if(where instanceof Array) {
            switch(type) {
                // And condition of array
                case "and":
                    return where.every((whereItem) => (
                        this.validateWhere(whereItem, "and")
                    ));

                // Or condition of array
                case "or":
                    return where.some((whereItem) => (
                        this.validateWhere(whereItem, "and")
                    ));

                default:
                    throw new Error("Unknow type where");
            }
        }
        else {
            // callback to analize every key conditions
            const callback = (key: string): boolean => {
                let result: boolean;

                switch(key) {
                    // analize and condition
                    case "@and":
                        if(where[key] instanceof Object && where[key] !== null) {
                            result = this.validateWhere(where[key], "and");
                        }
                        else throw new Error("Condition '@and' is not a valid array or object");
                    break;
    
                    // analize or condition
                    case "@or":
                        if(where[key] instanceof Object && where[key] !== null) {
                            result = this.validateWhere(where[key], "or");
                        }
                        else throw new Error("Condition '@or' is not a valid array or object");
                    break;
                    
                    // validate value where item
                    default:
                        const currentValue = this.thread.getVar(key);
                        
                        result = this.validateWhereItem(currentValue, where[key]);
                }

                return result;
            }

            // Get keys of where condition
            const keys = Object.keys(where);
            
            // switch type condition
            switch(type) {
                case "and":
                    return keys.every(callback);

                case "or":
                    return keys.some(callback);

                default:
                    throw new Error("Unknow type where");
            }
        }
    }

    /**
     * Validate value where item
     * @param value Value
     * @param where Where item
     * @returns result where comparation
     */
    public validateWhereItem(value: IJsonValue, where: IValueBase): boolean {
        // Validate in condition
        if(where instanceof Array) {
            return where.some((whereItem) => (
                this.validateWhereItem(value, whereItem)
            ));
        }
        // validate object condition
        else if(where instanceof Object && where !== null) {
            const isValueObject = value instanceof Object && value !== null;

            return isValueObject && Object.keys(where).every((keyname) => (
                this.validateWhereItem((value as any)[keyname], where[keyname])
            ));
        }
        else {
            // validate exist value or comparation exact value
            if(where === "*") {
                return !!value;
            }
            return where === value;
        }
    }
    
}