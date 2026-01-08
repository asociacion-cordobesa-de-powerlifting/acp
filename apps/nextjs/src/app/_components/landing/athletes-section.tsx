import { queryClient, trpc } from '~/trpc/server';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@acme/ui/table';
import { Badge } from '@acme/ui/badge';

const genderLabels: Record<string, string> = {
    M: 'Masculino',
    F: 'Femenino',
};

export default async function AthletesSection() {
    const athletes = await queryClient.fetchQuery(trpc.athletes.publicList.queryOptions());

    if (athletes.length === 0) {
        return null;
    }

    return (
        <section
            id="atletas"
            className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        >
            <div className="max-w-6xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                        Atletas Registrados
                    </h2>
                    <p className="text-muted-foreground">
                        Atletas que compiten bajo la Asociación Cordobesa de Powerlifting
                    </p>
                </div>

                <div className="rounded-lg border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead className="text-center">Género</TableHead>
                                <TableHead className="text-right">Squat (kg)</TableHead>
                                <TableHead className="text-right">Bench (kg)</TableHead>
                                <TableHead className="text-right">Deadlift (kg)</TableHead>
                                <TableHead className="text-right">Total (kg)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {athletes.map((athlete) => (
                                <TableRow key={athlete.id}>
                                    <TableCell className="font-medium">
                                        {athlete.fullName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {athlete.teamName}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={athlete.gender === 'M' ? 'default' : 'secondary'}>
                                            {genderLabels[athlete.gender] ?? athlete.gender}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {athlete.squatBestKg}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {athlete.benchBestKg}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {athlete.deadliftBestKg}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums font-semibold">
                                        {athlete.squatBestKg + athlete.benchBestKg + athlete.deadliftBestKg}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <p className="text-sm text-muted-foreground mt-4 text-center">
                    Mostrando {athletes.length} atletas registrados
                </p>
            </div>
        </section>
    );
}
