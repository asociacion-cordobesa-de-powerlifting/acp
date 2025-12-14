import { authRouter } from "./router/auth";
import { teamsRouter } from "./router/teams";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  teams: teamsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
