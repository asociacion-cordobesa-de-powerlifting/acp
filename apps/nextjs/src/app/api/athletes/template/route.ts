import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        // Create template data with headers and example row
        const templateData = [
            {
                'Nombre Completo': 'Juan Pérez',
                'DNI': '12345678',
                'Año de Nacimiento': 1995,
                'Género (M/F)': 'M',
                'Sentadilla Best (Kg)': 100,
                'Banca Best (Kg)': 80,
                'Despegue Best (Kg)': 120,
            },
        ];

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Atletas');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Nombre Completo
            { wch: 15 }, // DNI
            { wch: 18 }, // Año de Nacimiento
            { wch: 15 }, // Género
            { wch: 20 }, // Sentadilla Best
            { wch: 18 }, // Banca Best
            { wch: 18 }, // Despegue Best
        ];

        // Generate buffer
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Return the Excel file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="plantilla_atletas.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generating template:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
