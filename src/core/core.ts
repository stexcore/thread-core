import { IThreadScriptConstructor, IThreadServiceConstructor } from "../types/script";
import { ThreadScript } from "./script";
import { ThreadService } from "./service";
import Thread from "./thread";

/**
 * Thread core
 */
export default class ThreadCore {
    
    /**
     * Associated threads 
     */
    private threads: Thread[] = [];

    /**
     * Avariables scripts
     */
    private scripts: { name: string, constructor: IThreadScriptConstructor }[] = [];

    /**
     * Avariables services
     */
    private services: ThreadService[] = [];

    /**
     * create structure thread
     */
    private ThreadConstructor = class extends Thread {

        /**
         * Parent reference
         */
        private __parent!: ThreadCore;

        /**
         * Running state
         */
        private __running: boolean = true;

        /**
         * Local variables
         */
        private __vars: IJson = {};

        /**
         * Instances sentences
         */
        private __instances: {
            /**
             * Sentences
             */
            sentences: ISentence[],
            /**
             * Indexing level sentences
             */
            levels: number[]
        }[] = [];

        /**
         * Instance script running
         */
        private __script_running: { instance: ThreadScript<any>, aborted: boolean } | null = null;

        /**
         * Timer to initial execute
         */
        private __initial_timer: NodeJS.Timeout | null = null;

        /**
         * Initialize instance
         */
        constructor(settings: IThreadConfig) {
            super();

            // append sentences
            if(settings.sentences) {
                // start execution
                this.__initial_timer = setTimeout(() => {
                    this.__initial_timer = null;
                    this.execute(settings.sentences!, settings.entry_label);
                });
            }
            else throw new Error("The sentences have not been specified");

            // append vars
            if(settings.vars) this.__vars = {...settings.vars};
        }

        /**
         * Destroy thread
         */
        public destroy(): void {
            if(this.__running) {
                this.__running = false;

                // if timer execute
                if(this.__initial_timer) {
                    clearTimeout(this.__initial_timer);
                    this.__initial_timer = null;
                }

                // if executing script
                if(this.__script_running && !this.__script_running.aborted) {
                    // Stop script running
                    if(this.__script_running.instance.onParentRequireAbort) {
                        this.__script_running.instance.onParentRequireAbort();
                    }
                    this.__script_running.aborted = true;
                    this.__script_running = null;
                }

                // Remove thread memory
                this.__parent.threads = this.__parent.threads.filter((threadItem) => {
                    return threadItem !== this;
                });
            }
            else throw new Error("Thread is not running!");
        }

        /**
         * Is running thread
         */
        public get isRunning(): boolean {
            return this.__running;
        }

        /**
         * Get value
         * @param name variable name
         * @returns variable value
         */
        public getVar(name: string): IJsonValue {
            return this.__vars[name] ?? null;
        }

        /**
         * Set a new value into a variable
         * @param name variable name
         * @param value value name
         */
        public setVar(name: string, value: IJsonValue): void {
            if(value === null) {
                // delete variable
                delete this.__vars[name];
            }
            else {
                // set value
                this.__vars[name] = value;
            }
        }

        /**
         * Get all variables of current thread
         * @returns Variables object
         */
        public getAllVars(): IJson {
            return this.__vars;
        }

        /**
         * Execute sentences into current thread
         * @param sentence Sentence
         * @param entry_label Entry sentence
         */
        public execute(sentence: ISentence, entry_label?: string): void {
            // instance execution
            const instance = {
                sentences: sentence instanceof Array ? sentence : [sentence],
                levels: [0]
            };

            // Entry label avariable?
            if(typeof entry_label === "string") {
                // search index entry
                const index = instance.sentences.findIndex((sentenceItem) => sentenceItem === entry_label);
            
                if(index !== -1) {
                    // set levels
                    instance.levels = [index]
                }
                else {
                    throw new Error("Entry label '" + entry_label + "' not found!");
                }
            }

            // append instance and execute current instruction
            this.__instances.push(instance);
            this.executeCurrentInstruction();
        }

        /**
         * Set the next step and execute instruction
         */
        private nextInstruction() {
            const pos = this.getCurrentPosition();

            // increment current index
            if(pos) {
                if(pos.parent_current_sentence) {
                    pos.index_current_sentence++;
                }
            }

            // execute position actual
            this.executeCurrentInstruction();
        }

        /**
         * Execute the current instruction
         */
        private executeCurrentInstruction() {
            if(!this.__running) {
                throw new Error("Thread is'nt running!");
            }

            if(this.__script_running) {
                // emit force abort running
                if(this.__script_running.instance.onParentRequireAbort) {
                    this.__script_running.instance.onParentRequireAbort();
                }
                this.__script_running.aborted = true;
                this.__script_running = null;
            }

            // get current position
            const pos = this.getCurrentPosition();

            if(pos) {
                // Label sentence
                if(typeof pos.current_sentence === "string") {
                    this.nextInstruction();
                }
                // Scope sentence
                else if(pos.current_sentence instanceof Array) {
                    pos.instance.levels.push(0);
                    this.executeCurrentInstruction();
                }
                // Without sentence
                else if(pos.current_sentence === null) {
                    // Up level
                    if(pos.parent_current_sentence) {
                        pos.instance.levels.pop();
                        this.nextInstruction();
                    }
                    // Up instance
                    else if(pos.parent_instance) {
                        this.__instances.pop();
                        this.nextInstruction();
                    }
                    // End thread
                    else {
                        this.destroy();
                    }
                }
                else {
                    // Instruction and constructor script
                    const instruction = pos.current_sentence;
                    const constructorScript = this.__parent.getScript(instruction.script);

                    // set temporal prototype variables
                    constructorScript.prototype.core = this.__parent;
                    constructorScript.prototype.instruction = instruction;
                    constructorScript.prototype.name = instruction.script;
                    constructorScript.prototype.thread = this;

                    // instance script
                    const currentScript = this.__script_running = {
                        instance: new constructorScript(),
                        aborted: false
                    };

                    // remove prototypes variables
                    delete constructorScript.prototype.core;
                    delete constructorScript.prototype.instruction;
                    delete constructorScript.prototype.name;
                    delete constructorScript.prototype.thread;

                    // set variables to instance script
                    (currentScript.instance as any).core = this.__parent;
                    (currentScript.instance as any).instruction = instruction;
                    (currentScript.instance as any).name = instruction.script;
                    (currentScript.instance as any).thread = this;

                    // Execute current script
                    this.__script_running.instance.onExecute()
                        .then(() => {
                            // check if equal script
                            if(currentScript === this.__script_running) {
                                this.__script_running = null;
                                this.nextInstruction();
                            }
                        })
                        .catch((err) => {
                            this.__script_running = null;
                            
                            if(!currentScript.aborted) {
                                // error execution
                                console.error(err);
                                this.destroy();
                            }
                        });
                }
            }
            else {
                // end thread
                this.destroy();
            }
        }

        /**
         * Get current position instance/level
         * @returns Information of position
         */
        private getCurrentPosition() {
            // Get instance information
            const topInstance = this.__instances[this.__instances.length-1];
            const parentInstance = this.__instances[this.__instances.length-2];

            if(topInstance) {
                let index: number = 0;
                let parent: ISentence | null = null;
                let sentence: ISentence | null = null;

                // Get level information
                if(topInstance.levels.length) {
                    sentence = topInstance.sentences;
    
                    for(let x = 0; x < topInstance.levels.length; x++) {
                        const level = topInstance.levels[x];

                        if(sentence instanceof Array) {
                            index = x;
                            parent = sentence;
                            sentence = sentence[level] ?? null;
                        }
                        else {
                            throw new Error("An attempt was made to access a non-existent index!");
                        }
                    }
                }

                // Return information position
                return {
                    instance: topInstance,
                    parent_instance: parentInstance,
                    current_sentence: sentence,
                    parent_current_sentence: parent,
                    get index_current_sentence() { // get position
                        return topInstance.levels[index]
                    },
                    set index_current_sentence(v: number) { // set a new position by external
                        topInstance.levels[index] = v;
                    }
                };
            }
        }

    };

    /**
     * general settings
     */
    private thread_config: IThreadConfig;
    
    /**
     * Initialize structure data of core
     */
    constructor(settings?: IThreadCoreConfig) {
        // append parent prototype
        this.ThreadConstructor.prototype["__parent"] = this;

        // set default settings
        this.thread_config = {
            ...settings?.thread
        };

        // register scripts when creating thread
        if(settings?.scripts) {
            settings.scripts.forEach((scriptItem) => {
                this.register(scriptItem.constructor, scriptItem.name);
            });
        }

        // Validate schema sentences
        if(settings?.thread?.sentences) this.validateSentencesOrException(settings.thread.sentences);
    }

    /**
     * Initialize core
     */
    public initialize(settings?: IThreadCoreConfig) {
        if(settings) {
            // register scripts
            if(settings.scripts) {
                settings.scripts.forEach((scriptItem) => {
                    this.register(scriptItem.constructor, scriptItem.name);
                });
            }
            // set thread config
            if(settings.thread) {
                if(settings?.thread?.sentences) this.validateSentencesOrException(settings.thread.sentences);

                // append new settings
                if(settings.thread.entry_label) this.thread_config.entry_label = settings.thread.entry_label;
                if(settings.thread.sentences) this.thread_config.sentences = settings.thread.sentences;
                if(settings.thread.vars) {
                    // validate object variables thread
                    if(!this.thread_config.vars) this.thread_config.vars = { };

                    // earch all variables
                    for(const key in settings.thread.vars) {
                        this.thread_config.vars[key] = settings.thread.vars[key];
                    }
                }
            }
        }
    }

    /**
     * Destroy core and destroy all threads running
     */
    public destroy() {
        // create a copy of array
        const threads = [...this.threads];

        // earch all thread to destroy instance and executions
        threads.forEach((threadItem) => {
            if(threadItem.isRunning) {
                threadItem.destroy();
            }
        });
    }
    
    /**
     * Create a new instance of thread
     */
    public createThread(settings?: IThreadConfig) {
        // validate schemas sentences
        if(settings?.sentences) this.validateSentencesOrException(settings.sentences);

        // create a new instance
        const thread = new this.ThreadConstructor({
            ...this.thread_config,
            vars: {
                ...this.thread_config?.vars,
                ...settings?.vars,
            },
        });

        // append thread instance
        this.threads.push(thread);

        // return instance
        return thread;
    }

    /**
     * Register a new script
     * @param script Script constructor
     * @param name Script name
     */
    public register(script: IThreadScriptConstructor, name: string): void;
    /**
     * Register a new service
     * @param service Service constructor
     */
    public register(service: IThreadServiceConstructor): void;
    /**
     * Implementation registration items
     * @param registration Instance constructor
     * @param name Script name
     */
    public register(registration: IThreadScriptConstructor | IThreadServiceConstructor, name?: string): void {
        
        // register script
        if(registration.prototype instanceof ThreadScript) {
            
            // check if schema has been provided!
            if(!("schema" in registration)) {
                throw new Error("'Schema' has not been provided!");
            }

            // Validate name has been provided!
            if(typeof name !== "string") {
                throw new Error("Script name has not been provided!");
            }

            // Validate if exists another script with equal name
            if(this.scripts.some((scriptItem) => scriptItem.name === name)) {
                throw new Error("Already exists another script with name '" + name + "'");
            }

            // Validate if exists another registred script based by equal instance
            if(this.scripts.some((scriptItem) => scriptItem.constructor === registration)) {
                console.warn("Already exists registered another script with equal constructor!");
            }
            
            // register script
            this.scripts.push({
                name: name,
                constructor: registration
            });
        }
        // register service
        else if(registration.prototype instanceof ThreadService) {
            // Validate if exists another service with equal constructor
            if(this.services.some((serviceItem) => serviceItem instanceof registration)) {
                throw new Error("Already exists registered another service with equal constructor!");
            }

            // register service
            this.services.push(new registration());
        }
        // unknow registration
        else {
            throw new Error("Registration item unknow!");
        }
    }

    /**
     * Validate the sentences based in her schemas
     * @param sentence Sentence
     */
    private validateSentencesOrException(sentence: ISentence) {

        // analize sentence with her labels
        const analize = (sentence: ISentence, labels: string[], schemas_references: ISchemaValue[]) => {
            if(sentence instanceof Array) {
                // Get labels
                const instanceLabels = sentence.filter((sentence) => typeof sentence === "string") as string[];

                // Analize labels
                instanceLabels.forEach((labelItem) => {
                    if(labels.includes(labelItem)) {
                        console.warn("Access between the tags '" + labelItem + "' is in conflict.");
                    }
                    else {
                        // append a new label founded
                        labels.push(labelItem);
                    }
                });

                // earch all sentences
                sentence.forEach((sentenceItem) => {
                    analize(sentenceItem, labels, [...schemas_references]);
                });
            }
            else if(sentence instanceof Object) {
                // get script by name
                const script = this.getScript(sentence.script);

                // analize schema and value
                const checkSchema = (schema: ISchema, value: IJson, schemas_references: ISchemaValue[]) => {
                    for(const key in schema) {
                        const schemaItem = schema[key];
                        const valueItem = value[key];
    
                        // validate if key is a key existent
                        if(key in value) {

                            // Check schema value
                            const checkSchemaValue = (schemaItem: ISchemaValue, valueItem: IJsonValue, schemas_references: ISchemaValue[]) => {
                                switch(schemaItem.type) {

                                    // Check string schema
                                    case "string":
                                        if(typeof valueItem !== "string") {
                                            throw new Error("Field '" + key + "' is'nt of type 'string'");
                                        }
                                        if(typeof schemaItem.minLength === "number" && valueItem.length < schemaItem.minLength) {
                                            throw new Error("Field '" + key + "' must have a minimum length of " + schemaItem.minLength + " characters");
                                        }
                                        if(typeof schemaItem.maxLength === "number" && valueItem.length > schemaItem.maxLength) {
                                            throw new Error("Field '" + key + "' must have a maximum character length of " + schemaItem.maxLength);
                                        }
                                        if(schemaItem.label_reference && !labels.includes(valueItem)) {
                                            throw new Error("The field '" + key + "' cannot find the reference to the label '" + valueItem + "'");
                                        }
                                        break;
        
                                    // Check null schema
                                    case "null":
                                        if(valueItem !== null) {
                                            throw new Error("Field '" + key + "' is'nt of type 'null'");
                                        }
                                        break;
        
                                    // Check number schema
                                    case "number":
                                        if(typeof valueItem !== "number") {
                                            throw new Error("Field '" + key + "' is'nt of type 'null'");
                                        }
                                        if(typeof schemaItem.min === "number" && valueItem < schemaItem.min) {
                                            throw new Error("Field '" + key + "' must have a minimum numeric value of " + schemaItem.min);
                                        }
                                        if(typeof schemaItem.max === "number" && valueItem > schemaItem.max) {
                                            throw new Error("Field '" + key + "' must have a maximum numeric value of " + schemaItem.max);
                                        }
                                        break;
        
                                    // Check boolean schema
                                    case "boolean":
                                        if(typeof valueItem !== "boolean") {
                                            throw new Error("Field '" + key + "' is'nt of type 'boolean'");
                                        }
                                        break;
                                        
                                    // Check object schema
                                    case "object":
                                        // validate type value
                                        if(!(valueItem instanceof Object && !(valueItem instanceof Array)) || valueItem === null) {
                                            throw new Error("Field '" + key + "' is'nt of type 'object'");
                                        }
                                        // validate content
                                        if(schemaItem.content) checkSchema(schemaItem.content, valueItem, [...schemas_references, schemaItem]);

                                        // keys of schema of valueItem
                                        const keysExistent = Object.keys(schemaItem.content || {});
                                        const keysToAnalize = Object.keys(valueItem).filter(keyItem => !keysExistent.includes(keyItem));

                                        // value schema
                                        if("value" in schemaItem && schemaItem.value) {

                                            // earch remaining keys to analize values
                                            for(const keyItem of keysToAnalize) {
                                                checkSchemaValue(schemaItem.value, valueItem[keyItem], [...schemas_references, schemaItem]);
                                            }
                                        }

                                        // Allow dynamic keys in object
                                        if(!schemaItem.allow_dynamic_keys && keysToAnalize.length) {
                                            throw new Error("Keys dynamic is'nt allowed!");
                                        }
                                        break;
        
                                    // Check array schema
                                    case "array":
                                        if(!(valueItem instanceof Array)) {
                                            throw new Error("Field '" + key + "' is'nt of type 'array'");
                                        }

                                        // earch all values and validate all values by schema
                                        valueItem.forEach((valueArrItem) => {
                                            checkSchemaValue(schemaItem.content, valueArrItem, [...schemas_references, schemaItem]);
                                        });
                                        break;
        
                                    // Check sentences schema
                                    case "sentences":
                                        if((valueItem instanceof Object && valueItem !== null) || typeof valueItem === "string") {
                                            analize(valueItem as ISentence, labels, [...schemas_references, schemaItem]);
                                        }
                                        else {
                                            throw new Error("Field '" + key + "' is'nt of type 'sentences'");
                                        }
                                        break;

                                    // Check alternatives schemas
                                    case "alternatives":
                                        let resultAlternatives: boolean = !schemaItem.schema.length;

                                        // earch all schemas
                                        for(const schemaAltItem of schemaItem.schema) {
                                            try {
                                                // try value
                                                checkSchemaValue(schemaAltItem, valueItem, [...schemas_references, schemaItem]);
                                                resultAlternatives = true;
                                                break;
                                            }
                                            catch {
                                                // Catch error schema alternative
                                            }
                                        }

                                        if(!resultAlternatives) {
                                            throw new Error("No alternative schema matches (" + schemaItem.schema.map((schemaItem) => `'${schemaItem.type}'`) + ")")
                                        }
                                        break;

                                    // Check any value schema
                                    case "any":
                                        break;

                                    // Check referenced parent schema
                                    case "reference":
                                        const reference = [...schemas_references].reverse().find((schemaRefItem) => "name" in schemaRefItem && schemaRefItem.name === schemaItem.reference_name);

                                        if(!reference) {
                                            throw new Error("Does not exists the reference parent with name '" + schemaItem.reference_name + "'");
                                        }

                                        checkSchemaValue(reference, valueItem, [...schemas_references]);
                                        break;
                                        
                                    default:
                                        throw new Error("Unknow schema type '" + ((schemaItem as any) instanceof Object && "type" in (schemaItem as any) ? (schemaItem as any).type : "unknow") + "'!");
                                }
                            }
                            checkSchemaValue(schemaItem, valueItem, [...schemas_references]);
                        }
                        else if(!schemaItem.optional) {
                            // Schema is required!
                            throw new Error("Field '" + key + "' is required in the script '" + sentence.script + "'!");
                        }
                    }
                }
                checkSchema(script.schema, sentence, []);
            }
            else if(typeof sentence === "string") {
                // targets
            }
            else {
                throw new Error("Unknow sentence type '" + (typeof sentence) + "'");
            }
        };

        // Analize sentence
        analize(sentence, [], []);
    }

    /**
     * Get the script constructor registered by name
     * @param name Script name
     * @returns Script Constructor
     */
    private getScript(name: string): IThreadScriptConstructor {
        const script = this.scripts.find((scriptItem) => scriptItem.name === name);

        // Script is founded
        if(!script) {
            throw new Error("Is'nt registered a script by name '" + name + "'");
        }

        return script.constructor;
    }
    
}