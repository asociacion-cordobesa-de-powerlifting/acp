import { queryClient, trpc } from '~/trpc/server';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@acme/ui/card';
import { UsersIcon } from '@acme/ui/icons';

export default async function TeamsSection() {
    const teams = await queryClient.fetchQuery(trpc.teams.publicList.queryOptions());

    if (teams.length === 0) {
        return null;
    }

    return (
        <section
            id="equipos"
            className="py-20 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Equipos
                    </h2>
                    <p className="text-muted-foreground">
                        Conocé los equipos registrados en la Asociación
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {teams.map((team) => (
                        <Card
                            key={team.id}
                            className="hover:shadow-lg transition border-l-4 border-l-primary/30"
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    {team.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <UsersIcon className="h-4 w-4 text-primary" />
                                    <span>{team.athleteCount} atletas</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
