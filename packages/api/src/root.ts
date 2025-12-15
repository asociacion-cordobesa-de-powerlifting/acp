import { authRouter } from "./router/auth";
import { teamsRouter } from "./router/teams";
import { tournamentsRouter } from "./router/tournaments";
import { athletesRouter } from "./router/athletes";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  teams: teamsRouter,
  tournaments: tournamentsRouter,
  athletes: athletesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
