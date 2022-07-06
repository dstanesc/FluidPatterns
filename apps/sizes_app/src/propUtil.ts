/* eslint-disable no-multi-spaces */
/* eslint-disable no-multiple-empty-lines */








export function serializeToArray(map: Map<string, any>): any[] {
    const str: any[] = [];
    map.forEach((value, key) => {
            if (value instanceof Map) {
                str.push([key, serializeToArray(value as Map<string, any>)]);
            } else {
                str.push([key, value]);
            }
        },
    );

    return str;
}

export function deserializeFromArray(arr: any[]): Map<string, any> {
    const map: Map<string, any> = new Map();
    if (arr.length === 2 && !Array.isArray(arr[0])) {
        if (!Array.isArray(arr[1])) {
            map.set(arr[0], arr[1]);
        } else if (Array.isArray(arr[1])) {
            map.set(arr[0], deserializeFromArray(arr[1]));
        }
    } else {
        arr.forEach((value, index) => {
            deserializeFromArray(value as any[]).forEach((value2, key) => {
                map.set(key, value2);
            },
            );
        },
        );
    }
    return map;
}

export function serializeNestedMap(map: Map<string, any>): string {
    const serializedMap: string = JSON.stringify(serializeToArray(map));
    return serializedMap;
}

export function  deserializeNestedMap(serializedMap: string): Map<string, any> {
    if (serializedMap.length > 0) {
        return deserializeFromArray(JSON.parse(serializedMap));
    } else {
        return new Map();
    }
}

export function cloneMap(map: Map<string, any>): Map<string, any> {
    return deserializeNestedMap(serializeNestedMap(map));
}
