import { log } from "../debug/log";
import { writeFileSync_safe } from "../lib/utils";

function determineArrayTypes(array: any[], name: string, key: string, depth: number, interfacesMap: Object) {
    const types = new Set();
    let mergedObject = {};

    array.forEach(item => {
        const itemType = typeof item;
        if (itemType === 'object' && item !== null) {
            if (Array.isArray(item)) {
                // 处理多维数组
                const nestedArrayInterfaceName = `${name}_${key.charAt(0).toUpperCase() + key.slice(1)}Item`;
                const nestedType = determineArrayTypes(item, nestedArrayInterfaceName, key, depth, interfacesMap);
                types.add(`${nestedType}[]`);
            } else {
                // 处理对象数组，合并对象属性
                const mergeObjectBase = (src: Object, dst: Object) => {
                    for (const key in dst) {
                        if (src[key]) {
                            if (typeof dst[key] === 'object') {
                                mergeObjectBase(src[key], dst[key]);
                            }
                        } else {
                            src[key] = dst[key];
                        }
                    }
                }
                mergeObjectBase(mergedObject, item);
                // mergedObject = { ...mergedObject, ...item };
            }
        } else {
            // 处理基本类型
            types.add(itemType);
        }
    });

    if (Object.keys(mergedObject).length > 0) {
        // 如果数组中有对象，生成统一的接口
        const nestedInterfaceName = `${name}_${key.charAt(0).toUpperCase() + key.slice(1)}Item`;
        generateInterface(nestedInterfaceName, mergedObject, depth, interfacesMap);
        types.add(nestedInterfaceName);
    }

    return [...types].join(' | '); // 返回联合类型
}

function generateInterface(name: string, obj: Object, depth = 0, interfacesMap: Object) {
    const indent = '  '.repeat(depth);
    let interfaceStr = `${indent}export interface ${name} {\n`;

    // 防止重复生成接口
    if (interfacesMap[name]) {
        // return interfacesMap[name]; // 如果已经生成过这个接口，直接返回
    }

    for (const key in obj) {
        const value = obj[key];
        const valueType = typeof value;

        if (valueType === 'object' && value !== null && !Array.isArray(value)) {
            // 递归处理嵌套对象
            const nestedInterfaceName = `${name}_${key.charAt(0).toUpperCase() + key.slice(1)}`;
            interfaceStr += `${indent}  ${key}: ${nestedInterfaceName};\n`;
            generateInterface(nestedInterfaceName, value, depth, interfacesMap); // 生成嵌套接口
        } else if (Array.isArray(value)) {
            // 处理数组类型，使用新的函数来确定数组的联合类型
            const arrayType = determineArrayTypes(value, name, key, depth, interfacesMap);
            interfaceStr += `${indent}  ${key}: ${arrayType}[];\n`;
        } else {
            // 处理基本类型
            interfaceStr += `${indent}  ${key}: ${valueType};\n`;
        }
    }

    interfaceStr += `${indent}}\n`;
    interfacesMap[name] = interfaceStr; // 将接口存储在接口映射中
    return interfaceStr;
}

// 整合最终接口
export function generateInterfaces(name: string, obj: Object) {
    const interfacesMap = {};
    const mainInterface = generateInterface(name, obj, 0, interfacesMap);
    const str = Object.values(interfacesMap).join('\n');
    writeFileSync_safe(`types/${name}.d.ts`, str);
    log(`generate types/${name}.d.ts success.`);
}


