import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

let sqlClient: ReturnType<typeof postgres> | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is required")
    sqlClient = postgres(url, { max: 10 })
    dbInstance = drizzle(sqlClient, { schema })
  }
  return dbInstance
}

export function getSql() {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is required")
    sqlClient = postgres(url, { max: 10 })
    dbInstance = drizzle(sqlClient, { schema })
  }
  return sqlClient
}
