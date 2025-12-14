import { authRouter } from "./router/auth";
import { teamsRouter } from "./router/teams";
import { tournamentsRouter } from "./router/tournaments";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  teams: teamsRouter,
  tournaments: tournamentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
