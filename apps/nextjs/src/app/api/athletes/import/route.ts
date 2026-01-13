import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { auth } from '~/auth/server';
import { headers } from 'next/headers';
import { db } from '@acme/db/client';
import { athlete, teamData } from '@acme/db/schema';
import { eq, and, isNull } from '@acme/db';
import { dayjs } from '@acme/shared/libs';

interface AthleteRow {
    'Nombre Completo': string;
    'DNI': string;
    'Año de Nacimiento': number;
    'Género (M/F)': string;
    'Sentadilla Best (Kg)': number;
    'Banca Best (Kg)': number;
    'Despegue Best (Kg)': number;
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get team data
        const team = await db.query.teamData.findFirst({
            where: and(eq(teamData.userId, session.user.id), isNull(teamData.deletedAt))
        });

        if (!team) {
            return NextResponse.json({ error: 'No team associated with this account' }, { status: 403 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Read file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return NextResponse.json({ error: 'Empty workbook' }, { status: 400 });
        }

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return NextResponse.json({ error: 'Invalid worksheet' }, { status: 400 });
        }

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<AthleteRow>(worksheet);

        if (jsonData.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        // Validate and prepare athletes
        const errors: string[] = [];
        const validAthletes: {
            fullName: string;
            dni: string;
            birthYear: number;
            gender: 'M' | 'F';
            squatBestKg: number;
            benchBestKg: number;
            deadliftBestKg: number;
            teamId: string;
        }[] = [];

        const currentYear = dayjs().year();

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNum = i + 2; // Excel row number (1-based + header)

            if (!row) continue;

            // Validate required fields
            const fullName = row['Nombre Completo']?.toString().trim();
            const dni = row['DNI']?.toString().trim();
            const birthYear = Number(row['Año de Nacimiento']);
            const gender = row['Género (M/F)']?.toString().toUpperCase().trim();
            const squatBestKg = Number(row['Sentadilla Best (Kg)']) || 0;
            const benchBestKg = Number(row['Banca Best (Kg)']) || 0;
            const deadliftBestKg = Number(row['Despegue Best (Kg)']) || 0;

            // Validation
            if (!fullName || fullName.length < 3) {
                errors.push(`Fila ${rowNum}: Nombre completo inválido (mínimo 3 caracteres)`);
                continue;
            }

            if (!dni || dni.length < 6) {
                errors.push(`Fila ${rowNum}: DNI inválido (mínimo 6 caracteres)`);
                continue;
            }

            if (!birthYear || birthYear < 1900 || birthYear > currentYear) {
                errors.push(`Fila ${rowNum}: Año de nacimiento inválido`);
                continue;
            }

            if (gender !== 'M' && gender !== 'F') {
                errors.push(`Fila ${rowNum}: Género inválido (debe ser M o F)`);
                continue;
            }

            if (squatBestKg < 0 || benchBestKg < 0 || deadliftBestKg < 0) {
                errors.push(`Fila ${rowNum}: Los valores de peso no pueden ser negativos`);
                continue;
            }

            validAthletes.push({
                fullName,
                dni,
                birthYear,
                gender: gender as 'M' | 'F',
                squatBestKg,
                benchBestKg,
                deadliftBestKg,
                teamId: team.id,
            });
        }

        // If there are validation errors, return them
        if (errors.length > 0 && validAthletes.length === 0) {
            return NextResponse.json({
                error: 'Validation errors',
                details: errors
            }, { status: 400 });
        }

        // Insert valid athletes
        let insertedCount = 0;
        const insertErrors: string[] = [];

        for (const athleteData of validAthletes) {
            try {
                // Check if athlete with same DNI already exists in this team
                const existing = await db.query.athlete.findFirst({
                    where: and(
                        eq(athlete.teamId, team.id),
                        eq(athlete.dni, athleteData.dni),
                        isNull(athlete.deletedAt)
                    )
                });

                if (existing) {
                    insertErrors.push(`${athleteData.fullName} (DNI: ${athleteData.dni}): Ya existe en el equipo`);
                    continue;
                }

                await db.insert(athlete).values(athleteData);
                insertedCount++;
            } catch (err) {
                insertErrors.push(`${athleteData.fullName}: Error al insertar`);
            }
        }

        return NextResponse.json({
            success: true,
            inserted: insertedCount,
            total: jsonData.length,
            validationErrors: errors,
            insertErrors: insertErrors,
        });
    } catch (error) {
        console.error('Error importing athletes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
