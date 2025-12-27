// import { sql } from "@vercel/postgres";
// import { drizzle } from "drizzle-orm/vercel-postgres";

// import * as schema from "./schema";

// export const db = drizzle({
//   client: sql,
//   schema,
//   casing: "snake_case",
// });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set");
}

// Para entornos serverless, es mejor crear un cliente por cada invocación.
// postgres.js está optimizado para esto y no creará nuevas conexiones TCP cada vez si se hace bien.
const client = postgres(process.env.POSTGRES_URL, {
  // `max` no debería ser 1. Un valor pequeño como 5 es un buen punto de partida 
  // para la mayoría de las aplicaciones serverless para evitar agotar el límite del pooler.
  max: 5,
  // `idle_timeout` y `connect_timeout` son buenos para manejar errores y liberar recursos.
  idle_timeout: 20, // Cierra conexiones inactivas después de 20 segundos
  connect_timeout: 10, // Timeout para establecer una conexión inicial
});

export const db = drizzle(client, { schema, casing: "snake_case" });