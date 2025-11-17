import { HydrateClient, queryClient, trpc } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";

export default async function HomePage() {

  const query = trpc.auth.test.queryOptions()
  const data = await queryClient.fetchQuery(query)

  console.log('Data', data)

  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-primary">T3</span> Turbo
          </h1>
          <AuthShowcase />

        </div>
      </main>
    </HydrateClient>
  );
}
