import axios from "axios"

export type RecursiveMap = Map<string, RecursiveMap>
export type FinalResultRecursive = Array<Record<string, FinalResultRecursive> | string>

export const parseUrl = (url: string) => {
    const urlObject = new URL(url)
    const ip = urlObject.hostname
    const pathParts = urlObject.pathname.split('/').filter(part => part)

    return [ip, ...pathParts]
}

export const processParts = (items: string[][]) => {
    const resultMap: RecursiveMap = new Map()

    const processPartsHelper = (parts: string[]) => {
        let map = resultMap

        parts.forEach(part => {
            if (!map.has(part)) {
                map.set(part, new Map())
            }
            map = map.get(part)! as RecursiveMap
        })
    }

    items.forEach(it => processPartsHelper(it))

    return resultMap
}

export const processMapLayer = (
    map: RecursiveMap,
    parentLayer: FinalResultRecursive,
) => {
    map.forEach((v, k) => {
        if (v.size > 0) {
            if (parentLayer.find(it => typeof it === 'object' && it[k] != null) == null) {
                parentLayer.push({ [k]: [] })
            }

            const childLayer = (parentLayer.find(it => typeof it === 'object' && it[k] != null)! as Record<string, FinalResultRecursive>)[k]

            processMapLayer(v, childLayer)
        } else if (v.size === 0 && parentLayer.find(it => it === k) == null) {
            parentLayer.push(k)
        }
    })
}

let cacheData: undefined | Promise<{ fileUrl: string }[]> | { fileUrl: string }[]

export const getFromCache = async (): Promise<FinalResultRecursive> => {
    if (cacheData == null) {
        cacheData = initializeCache()
    }

    const urls = await cacheData
    const parsedItems = urls.map(url => parseUrl(url.fileUrl))
    const recursiveMap = processParts(parsedItems)
    const result: FinalResultRecursive = []
    processMapLayer(recursiveMap, result)
    return result

}

const initializeCache = async (): Promise<{ fileUrl: string }[]> => {
    const URL = 'https://rest-test-eight.vercel.app/api/test'
    const response = await axios.get(URL)
    return response.data.items
}