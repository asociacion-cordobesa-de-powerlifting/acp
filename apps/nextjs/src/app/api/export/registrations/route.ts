import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { auth } from '~/auth/server';
import { headers } from 'next/headers';
import { db } from '@acme/db/client';
import { registrations, tournament, event, athlete, teamData, user } from '@acme/db/schema';
import { eq, and, isNull, inArray, desc } from '@acme/db';
import { getLabelFromValue, mapTournamentDivisionToAthleteDivision } from '@acme/shared';
import { ATHLETE_DIVISION, ATHLETE_GENDER, EQUIPMENT, MODALITIES, REGISTRATION_STATUS, WEIGHT_CLASSES } from '@acme/shared/constants';
import { dayjs } from '@acme/shared/libs';

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.role || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get eventId from search params
        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        // Verify event exists
        const eventData = await db.query.event.findFirst({
            where: and(eq(event.id, eventId), isNull(event.deletedAt))
        });

        if (!eventData) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Get all tournaments for this event
        const eventTournaments = await db.query.tournament.findMany({
            where: and(eq(tournament.eventId, eventId), isNull(tournament.deletedAt)),
        });

        if (eventTournaments.length === 0) {
            return NextResponse.json({ error: 'No tournaments found for this event' }, { status: 404 });
        }

        const tournamentIds = eventTournaments.map(t => t.id);

        // Get all registrations for these tournaments
        const allRegistrations = await db.query.registrations.findMany({
            where: and(
                inArray(registrations.tournamentId, tournamentIds),
                isNull(registrations.deletedAt)
            ),
            with: {
                athlete: true,
                tournament: { with: { event: true } },
                team: { with: { user: true } }
            },
            orderBy: [desc(registrations.createdAt)],
        });

        // Transform data for Excel
        const excelData = allRegistrations.map((reg) => {
            const athleteDivision = mapTournamentDivisionToAthleteDivision(
                reg.tournament.division,
                reg.athlete.birthYear
            );

            return {
                'Atleta': reg.athlete.fullName,
                'DNI': reg.athlete.dni,
                'Equipo': reg.team.user?.name || '-',
                'Género': getLabelFromValue(reg.athlete.gender, ATHLETE_GENDER),
                'Año Nacimiento': reg.athlete.birthYear,
                'División': getLabelFromValue(athleteDivision, ATHLETE_DIVISION),
                'Categoría de Peso': getLabelFromValue(reg.weightClass, WEIGHT_CLASSES),
                'Modalidad': getLabelFromValue(reg.tournament.modality, MODALITIES),
                'Equipamiento': getLabelFromValue(reg.tournament.equipment, EQUIPMENT),
                'Estado Inscripción': getLabelFromValue(reg.status, REGISTRATION_STATUS),
                'Sentadilla Best (Kg)': reg.athlete.squatBestKg ?? 0,
                'Banca Best (Kg)': reg.athlete.benchBestKg ?? 0,
                'Despegue Best (Kg)': reg.athlete.deadliftBestKg ?? 0,
                'Total Estimado': (reg.athlete.squatBestKg ?? 0) + (reg.athlete.benchBestKg ?? 0) + (reg.athlete.deadliftBestKg ?? 0),
                'Fecha Inscripción': dayjs(reg.createdAt).format('DD/MM/YYYY HH:mm'),
            };
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscripciones');

        // Set column widths
        const colWidths = [
            { wch: 30 }, // Atleta
            { wch: 12 }, // DNI
            { wch: 25 }, // Equipo
            { wch: 12 }, // Género
            { wch: 15 }, // Año Nacimiento
            { wch: 15 }, // División
            { wch: 20 }, // Categoría de Peso
            { wch: 15 }, // Modalidad
            { wch: 15 }, // Equipamiento
            { wch: 18 }, // Estado Inscripción
            { wch: 18 }, // Sentadilla Best
            { wch: 15 }, // Banca Best
            { wch: 18 }, // Despegue Best
            { wch: 15 }, // Total Estimado
            { wch: 18 }, // Fecha Inscripción
        ];
        worksheet['!cols'] = colWidths;

        // Generate buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Create safe filename
        const safeEventName = eventData.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);
        const filename = `Inscripciones_${safeEventName}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

        // Return the Excel file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error generating Excel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
