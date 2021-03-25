class ClassSerializer {
    public superclass_constructors: Array<Function>;

    constructor(
        public class_constructor: Function,
        public member_blacklist: Array<any> = [],
        public member_whitelist: Array<any> = [],
    ) {
        this.superclass_constructors = get_prototype_chain(class_constructor);
    }

    public can_serialize_object(instance: Object): boolean {
        return instance.constructor === this.class_constructor;
    }

    protected is_member_serializable_no_super(member_name: any): boolean {
        if (this.member_whitelist.length > 0) {
            return this.member_whitelist.includes(member_name);
        }

        return !this.member_blacklist.includes(member_name);
    }

    public is_member_serializable(member_name: any): boolean {
        for (const superclass of this.superclass_constructors) {
            const config = get_config_by_name(superclass.name);
            if (!config.is_member_serializable_no_super(member_name)) {
                return false;
            }
        }
        
        return this.is_member_serializable_no_super(member_name);
    }

    public get class_name(): string {
        return this.class_constructor.name;
    }

    public serialize_value(result: SerializedObjectMetadata, member_name: any, value: any): any {
        if (!this.is_member_serializable(member_name)) {
            return undefined;
        }

        let config: ClassSerializer | undefined;
        if (value && typeof value == "object" && (config = find_config(value))) {
            result.serialized_members.push(member_name);
            return config.serialize_to_object(value);
        } else {
            return value;
        }
    }

    public serialize_to_object(obj: AnyObject): SerializedObjectMetadata {
        const serialized: SerializedObjectMetadata = {
            class_name: obj.constructor.name,
            object: {},
            serialized_members: []
        };

        for (const member_name of Object.keys(obj)) {
            const val = this.serialize_value(serialized, member_name, obj[member_name]);
            if (typeof val != "undefined") {
                serialized.object[member_name] = val;
            }
        }
    
        return serialized;
    }

    public unserialize_value(serialized: SerializedObjectMetadata, member_name: any, value: any): any {
        if (!this.is_member_serializable(member_name)) {
            return undefined;
        }

        if (serialized.serialized_members.includes(member_name)) {
            assert_serialized_object(value);
            return get_config_by_name(value.class_name).unserialize_object(value);
        } else {
            return value;
        }
    }

    public unserialize_object(serialized: SerializedObjectMetadata): Object {
        const result = Object.create(this.class_constructor.prototype);
        
        for (const member_name of Object.keys(serialized.object)) {
            const val = this.unserialize_value(serialized, member_name, serialized.object[member_name]);
            if (typeof val != "undefined") {
                result[member_name] = val;
            }
        }
    
        return result;
    }
}

class ArraySerializer extends ClassSerializer {
    constructor() {
        super(Array, [], []);
    }

    public serialize_to_object(obj: Array<any>): SerializedObjectMetadata {
        const serialized = {
            class_name: "Array",
            object: Array(),
            serialized_members: []
        };

        for (let i = 0; i < obj.length; i++) {
            serialized.object.push(this.serialize_value(serialized, i, obj[i]));
        }

        return serialized;
    }

    public unserialize_object(serialized: SerializedObjectMetadata): Array<any> {
        const result = new Array();

        for (let i = 0; i < (serialized.object as Array<any>).length; i++) {
            result.push(this.unserialize_value(serialized, i, serialized.object[i]));
        }

        return result;
    }
}

/**
 * Special serializer for Map objects.
 */
class MapSerializer extends ClassSerializer {
    constructor() {
        super(Map, [], []);
    }

    public serialize_to_object(obj: Map<any, any>): SerializedObjectMetadata {
        const serialized = {
            class_name: "Map",
            object: Array(),
            serialized_members: []
        };

        for (const [key, val] of obj) {
            serialized.object.push([key, this.serialize_value(serialized, key, val)]);
        }

        return serialized;
    }

    public unserialize_object(serialized: SerializedObjectMetadata): Map<any, any> {
        const result = new Map();

        for (const [key, value] of serialized.object as Array<[any, any]>) {
            result.set(key, this.unserialize_value(serialized, key, value))
        }

        return result;
    }
}

const class_configs: Array<ClassSerializer> = [new ArraySerializer(), new MapSerializer()];

class ClassNotRegisteredError extends Error {
    constructor(class_name: string) {
        super(`Class "${class_name}" has not been registered for serialization`);
    }
}

function find_config(obj: Object): ClassSerializer | undefined {
    for (const config of class_configs) {
        if (config.can_serialize_object(obj)) {
            return config;
        }
    }
}

function get_config(obj: Object): ClassSerializer {
    const config = find_config(obj);

    if (!config) {
        throw new ClassNotRegisteredError(obj.constructor.name);
    }

    return config;
}

function get_config_by_name(class_name: string): ClassSerializer {
    for (const config of class_configs) {
        if (config.class_name == class_name) {
            return config;
        }
    }

    throw new ClassNotRegisteredError(class_name);
}

function get_prototype_chain(obj: Object): Array<Function> {
    const chain: Array<Function> = [];

    let cur = Reflect.getPrototypeOf(obj);

    while (typeof cur == "function" && cur.name) {
        chain.push(cur);
        cur = Reflect.getPrototypeOf(cur);
    }

    return chain;
}

/**
 * A class decorator that registers the class for serialization.
 */
export const Serializable: ClassDecorator = function Serializable(ctor: Function) {
    const config = new ClassSerializer(ctor);
    class_configs.push(config);
}

function assert_string_key_only(prop: PropertyKey): asserts prop is string {
    if (typeof prop != "string") {
        throw new Error("Only properties whose key is a string are allowed");
    }
}

export const SerializationWhitelist: PropertyDecorator = function SerializationWhitelist(target: Object, prop: PropertyKey) {
    assert_string_key_only(prop);

    const config = find_config(target);
    if (config) {
        config.member_whitelist.push(prop);
    } else {
        class_configs.push(new ClassSerializer(target.constructor, [], [prop]));
    }
}

export const SerializationBlacklist: PropertyDecorator = function SerializationBlacklist(target: Object, prop: PropertyKey) {
    assert_string_key_only(prop);
    
    const config = find_config(target);
    if (config) {
        config.member_blacklist.push(prop);
    } else {
        class_configs.push(new ClassSerializer(target.constructor, [prop], []));
    }
}

type AnyObject = Record<any, any>;

type SerializedObjectMetadata = {
    class_name: string;
    object: AnyObject;
    serialized_members: Array<any>;
};

type SerializationMetadata = {
    schema_version: number;
    serialization_date: number;
    data: Object;
};

function assert_metadata(obj: AnyObject): asserts obj is SerializationMetadata {
    if (!obj || typeof obj["schema_version"] != "number" ||
            typeof obj["serialization_date"] != "number" ||
            typeof obj["data"] != "object") {
        throw new Error("Malformed serialized data");
    }
}

/**
 * Does not support cycles in the data.
 */
export function serialize_to_json(obj: AnyObject, schema_version: number): string {
    const meta: SerializationMetadata = {
        schema_version,
        serialization_date: Date.now(),
        data: get_config(obj).serialize_to_object(obj)
    };
    return JSON.stringify(meta);
}

function assert_serialized_object(obj: AnyObject): asserts obj is SerializedObjectMetadata {
    if (typeof obj["class_name"] != "string" ||
            typeof obj["object"] != "object" ||
            !Array.isArray(obj["serialized_members"])) {
        throw new Error("Object is not a valid serialized object");
    }
}

export function unserialize_json(json: string): SerializationMetadata {
    const meta = JSON.parse(json);

    assert_metadata(meta);
    assert_serialized_object(meta.data);

    meta.data = get_config_by_name(meta.data.class_name).unserialize_object(meta.data);
    return meta;
}
