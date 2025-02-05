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
         * Sentences
         */
        private __sentences: ISentence[] = [];

        /**
         * Execution levels
         */
        private __levels: number[] = [0];

        /**
         * Initialize instance
         */
        constructor(settings?: IThreadConfig) {
            super();

            if(settings) {
                // append sentences
                if(settings.sentences) this.__sentences = settings.sentences instanceof Array ? settings.sentences : [settings.sentences];
                else throw new Error("The sentences have not been specified");
    
                // append vars
                if(settings.vars) this.__vars = settings.vars;
    
                // Entry label avariable?
                if(typeof settings.entry_label === "string") {
                    // search index entry
                    const index = this.__sentences.findIndex((sentenceItem) => sentenceItem === settings.entry_label);
    
                    if(index !== -1) {
                        // set levels
                        this.__levels = [index]
                    }
                    else {
                        throw new Error("Entry label '" + settings.entry_label + "' not found!");
                    }
                }
            }
        }

        /**
         * Destroy thread
         */
        public destroy(): void {
            if(this.__running) {
                this.__running = false;

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
            if(value === null ) {
                delete this.__vars[name];
            }
            else {
                delete this.__vars[name];
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
         * Set the next step and execute instruction
         */
        private nextInstruction() {

        }

        /**
         * Execute the current instruction
         */
        private executeCurrentInstruction() {
            if(!this.__running) {
                throw new Error("Thread is'nt running!");
            }

            this.__sentences
        }

    };

    /**
     * general settings
     */
    private settings: IThreadCoreConfig;
    
    /**
     * Initialize structure data of core
     */
    constructor(settings?: IThreadCoreConfig) {
        // append parent prototype
        this.ThreadConstructor.prototype["__parent"] = this;

        // set default settings
        this.settings = {
            ...settings
        };
    }

    /**
     * Initialize core
     */
    public initialize(settings?: IThreadCoreConfig) {
        if(settings) {
            if(settings.thread) {
                // validate object settings thread
                if(!this.settings.thread) this.settings.thread = { };

                // append new settings
                if(settings.thread.entry_label) this.settings.thread.entry_label = settings.thread.entry_label;
                if(settings.thread.sentences) this.settings.thread.sentences = settings.thread.sentences;
                if(settings.thread.vars) {
                    // validate object variables thread
                    if(!this.settings.thread.vars) this.settings.thread.vars = { };

                    // earch all variables
                    for(const key in settings.thread.vars) {
                        this.settings.thread.vars[key] = settings.thread.vars[key];
                    }
                }
            }
        }
    }

    /**
     * Destroy core and destroy all threads running
     */
    public destroy() {

    }
    
    /**
     * Create a new instance of thread
     */
    public createThread(settings?: IThreadConfig) {

        // create a new instance
        const thread = new this.ThreadConstructor();

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
        if(registration instanceof ThreadScript && "schema" in registration) {

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
        else if(registration instanceof ThreadService) {
            // Validate if exists another service with equal constructor
            if(this.services.some((serviceItem) => serviceItem === registration)) {
                throw new Error("Already exists registered another service with equal constructor!");
            }

            // register service
            this.services.push(registration);
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
        const analize = (sentence: ISentence, labels: string[]) => {
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
                    analize(sentenceItem, labels);
                });
            }
            else if(sentence instanceof Object) {
                const script = this.scripts.find((scriptItem) => scriptItem.name === sentence.script);

                if(!script) {
                    throw new Error("Is'nt registered a script by name '" + sentence.script + "'");
                }

                // analize schema and value
                const checkSchema = (schema: ISchema, value: IJson) => {
                    for(const key in schema) {
                        const schemaItem = schema[key];
                        const valueItem = value[key];
    
                        if(key in value) {
                            const checkSchemaValue = (schemaItem: ISchemaValue, valueItem: IJsonValue) => {
                                switch(schemaItem.type) {
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
        
                                    case "null":
                                        if(valueItem !== null) {
                                            throw new Error("Field '" + key + "' is'nt of type 'null'");
                                        }
                                        break;
        
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
        
                                    case "object":
                                        if(!(valueItem instanceof Object && !(valueItem instanceof Array))) {
                                            throw new Error("Field '" + key + "' is'nt of type 'object'");
                                        }
                                        checkSchema(schemaItem.content, valueItem);
                                        break;
        
                                    case "array":
                                        if(!(valueItem instanceof Array)) {
                                            throw new Error("Field '" + key + "' is'nt of type 'array'");
                                        }
                                        valueItem.forEach((valueArrItem) => {
                                            checkSchemaValue(schemaItem.content, valueArrItem);
                                        });
                                        break;
        
                                    case "sentences":
                                        if(!((valueItem instanceof Object && valueItem !== null) || typeof valueItem === "string")) {
                                            throw new Error("Field '" + key + "' is'nt of type 'sentences'");
                                        }
                                        analize(valueItem as ISentence, labels);
                                        break;
        
                                    default:
                                        throw new Error("Unknow schema type!");
                                }
                            }
                            checkSchemaValue(schemaItem, valueItem);
                        }
                        else if(!schemaItem.optional) {
                            throw new Error("Field '" + key + "' is required in the script '" + script.name + "'!");
                        }
                    }
                }
            }
            else {
                // targets
            }
        };

        // Analize sentence
        analize(sentence, []);
    }
    
}