import express, { Express, Request, Response } from "express"
import { getUrlStructureFromCache } from "./procesUrl"

const app: Express = express()
const port = '5000'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/files", async function (req: Request, res: Response) {
    const result = await getUrlStructureFromCache()
    res.json(result)
})

app.listen(port, () => {
    getUrlStructureFromCache()
    console.log(`Server is running at PORT ${port}.`)
})
