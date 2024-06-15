import axios from "axios"

type RecursiveMap = Map<string, RecursiveMap>
type UrlStructureRecursive = Array<Record<string, UrlStructureRecursive> | string>

// If data changes, there should be mechanism to update cache
let cacheData: undefined | Promise<{ fileUrl: string }[]> | { fileUrl: string }[]

export const getUrlStructureFromCache = async (): Promise<UrlStructureRecursive> => {
    if (cacheData == null) {
        cacheData = getUrls()
    }
    const urls = await cacheData

    const parsedUrls = urls.map(url => parseUrl(url.fileUrl))
    const urlsMap = processUrlParsedParts(parsedUrls)

    const result: UrlStructureRecursive = []
    processLayer(urlsMap, result)

    return result
}

const getUrls = async (): Promise<{ fileUrl: string }[]> => {
    const URL = 'https://rest-test-eight.vercel.app/api/test'
    const response = await axios.get(URL)
    return response.data.items
}

const parseUrl = (url: string) => {
    const urlObject = new URL(url)
    return [
        urlObject.hostname,
        ...urlObject.pathname.split('/').filter(part => part),
    ]
}

const processUrlParsedParts = (items: string[][]) => {
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

const processLayer = (
    map: RecursiveMap,
    parentLayer: UrlStructureRecursive,
) => {
    map.forEach((v, k) => {
        if (v.size > 0) {
            if (parentLayer.find(it => typeof it === 'object' && it[k] != null) == null) {
                parentLayer.push({ [k]: [] })
            }

            const childLayer = (parentLayer.find(it => typeof it === 'object' && it[k] != null)! as Record<string, UrlStructureRecursive>)[k]

            processLayer(v, childLayer)
        } else if (v.size === 0 && parentLayer.find(it => it === k) == null) {
            parentLayer.push(k)
        }
    })
}
