'use client';

import React, { useMemo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@acme/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@acme/ui/select';
import { Input } from '@acme/ui/input';
import {
    getLabelFromValue,
} from '@acme/shared';
import {
    TOURNAMENT_DIVISION,
    MODALITIES,
    EQUIPMENT,
    WEIGHT_CLASSES,
    ATHLETE_GENDER,
    ATHLETE_DIVISION,
    DIVISION_RULES,
} from '@acme/shared/constants';

interface Registration {
    id: string;
    tournamentId: string;
    weightClass: string;
    tournament: {
        id: string;
        division: string;
        modality: string;
        equipment: string;
        status: string;
    };
    athlete: {
        id: string;
        fullName: string;
        birthYear: number;
        gender: string;
        squatBestKg: number;
        benchBestKg: number;
        deadliftBestKg: number;
    };
    teamName: string;
}

interface Tournament {
    id: string;
    division: string;
    modality: string;
    equipment: string;
    status: string;
}

interface RegistrationsTableProps {
    registrations: Registration[];
    availableTournaments: Tournament[];
    eventYear: number;
}

// Map tournament divisions to their possible age sub-divisions
const DIVISION_SUB_GROUPS: Record<string, string[]> = {
    juniors: ['subjunior', 'junior'],
    open: ['open'],
    masters: ['master_1', 'master_2', 'master_3', 'master_4'],
};

// Determine athlete's age sub-division based on their age
function getAgeSubDivision(birthYear: number, eventYear: number, tournamentDivision: string): string {
    const age = eventYear - birthYear;
    const possibleSubs = DIVISION_SUB_GROUPS[tournamentDivision];
    if (!possibleSubs || possibleSubs.length <= 1) return tournamentDivision;

    // Find the matching sub-division from DIVISION_RULES
    for (const rule of DIVISION_RULES) {
        if (possibleSubs.includes(rule.id) && age >= rule.min && age <= rule.max) {
            return rule.id;
        }
    }
    // Fallback: return the tournament division itself
    return tournamentDivision;
}

// Sort order for weight classes
const weightClassOrder = WEIGHT_CLASSES.map(wc => wc.value);

export function RegistrationsTable({ registrations, availableTournaments, eventYear }: RegistrationsTableProps) {
    // Nuqs state synced with URL
    const [division, setDivision] = useQueryState('division', parseAsString.withDefault(''));
    const [modality, setModality] = useQueryState('modality', parseAsString.withDefault(''));
    const [equipment, setEquipment] = useQueryState('equipment', parseAsString.withDefault(''));
    const [gender, setGender] = useQueryState('gender', parseAsString.withDefault(''));
    const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));

    // Extract available options from tournaments
    const availableOptions = useMemo(() => {
        const divisions = [...new Set(availableTournaments.map(t => t.division))];
        const modalities = [...new Set(availableTournaments.map(t => t.modality))];
        const equipments = [...new Set(availableTournaments.map(t => t.equipment))];
        const genders = [...new Set(registrations.map(r => r.athlete.gender))];

        return {
            divisions: TOURNAMENT_DIVISION.filter(d => divisions.includes(d.value)),
            modalities: MODALITIES.filter(m => modalities.includes(m.value)),
            equipments: EQUIPMENT.filter(e => equipments.includes(e.value)),
            genders: ATHLETE_GENDER.filter(g => genders.includes(g.value)),
        };
    }, [availableTournaments, registrations]);

    // Filter registrations
    const filteredRegistrations = useMemo(() => {
        return registrations.filter(r => {
            if (division && r.tournament.division !== division) return false;
            if (modality && r.tournament.modality !== modality) return false;
            if (equipment && r.tournament.equipment !== equipment) return false;
            if (gender && r.athlete.gender !== gender) return false;
            if (search && !r.athlete.fullName.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [registrations, division, modality, equipment, gender, search]);

    // Group registrations by ageDivision + gender + modality + equipment, then by weight class
    const groupedData = useMemo(() => {
        const groups: Record<string, Record<string, Registration[]>> = {};

        filteredRegistrations.forEach(r => {
            const ageSub = getAgeSubDivision(r.athlete.birthYear, eventYear, r.tournament.division);
            const groupKey = `${ageSub}-${r.athlete.gender}-${r.tournament.modality}-${r.tournament.equipment}`;
            if (!groups[groupKey]) groups[groupKey] = {};
            const weightClasses = groups[groupKey]!;
            if (!weightClasses[r.weightClass]) weightClasses[r.weightClass] = [];
            weightClasses[r.weightClass]!.push(r);
        });

        // Sort athletes within each weight class by total (descending)
        Object.values(groups).forEach(weightClasses => {
            Object.values(weightClasses).forEach(athletes => {
                athletes.sort((a, b) => {
                    const totalA = a.athlete.squatBestKg + a.athlete.benchBestKg + a.athlete.deadliftBestKg;
                    const totalB = b.athlete.squatBestKg + b.athlete.benchBestKg + b.athlete.deadliftBestKg;
                    return totalB - totalA;
                });
            });
        });

        return groups;
    }, [filteredRegistrations, eventYear]);

    // Define sort order for age sub-divisions
    const ageDivisionOrder = DIVISION_RULES.map(r => r.id);

    // Sort group keys by age division order
    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedData).sort((a, b) => {
            const [aSub] = a.split('-');
            const [bSub] = b.split('-');
            const aIdx = ageDivisionOrder.indexOf(aSub as any);
            const bIdx = ageDivisionOrder.indexOf(bSub as any);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
    }, [groupedData]);

    const getGroupLabel = (groupKey: string) => {
        const [ageSub, gen, mod, equip] = groupKey.split('-');
        const ageLabel = getLabelFromValue(ageSub, ATHLETE_DIVISION) || getLabelFromValue(ageSub, TOURNAMENT_DIVISION);
        const genLabel = getLabelFromValue(gen, ATHLETE_GENDER);
        const modLabel = getLabelFromValue(mod, MODALITIES);
        const equipLabel = getLabelFromValue(equip, EQUIPMENT);
        return `${ageLabel} ${genLabel} - ${modLabel} - ${equipLabel}`;
    };

    const formatWeight = (kg: number) => kg > 0 ? `${kg}` : '-';

    const hasActiveFilters = division || modality || equipment || gender || search;

    return (
        <div className="space-y-4">
            {/* Search bar only at top */}
            <div className="flex items-center">
                <Input
                    placeholder="Buscar atleta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value || null)}
                    className="max-w-xs"
                />

                <button
                    onClick={() => {
                        setDivision(null);
                        setModality(null);
                        setEquipment(null);
                        setGender(null);
                        setSearch(null);
                    }}
                    className="ml-2 text-xs text-muted-foreground hover:text-foreground transition underline"
                >
                    Mostrar todos los atletas en este evento
                </button>
            </div>

            {sortedGroupKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
                    <p>No se encontraron atletas con los filtros seleccionados.</p>
                </div>
            ) : (
                sortedGroupKeys.map((groupKey) => {
                    const weightClasses = groupedData[groupKey]!;
                    return (
                        <div key={groupKey} className="rounded-lg border bg-card overflow-hidden">
                            {/* Group Header */}
                            <div className="bg-primary text-primary-foreground px-4 py-3">
                                <h3 className="font-semibold text-lg">
                                    {getGroupLabel(groupKey)}
                                </h3>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Nombre</TableHead>
                                        <TableHead className="text-center">Año</TableHead>
                                        <TableHead>Equipo</TableHead>
                                        <TableHead className="text-right">SQ</TableHead>
                                        <TableHead className="text-right">BP</TableHead>
                                        <TableHead className="text-right">DL</TableHead>
                                        <TableHead className="text-right font-bold">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(weightClasses)
                                        .sort(([a], [b]) => weightClassOrder.indexOf(a as typeof weightClassOrder[number]) - weightClassOrder.indexOf(b as typeof weightClassOrder[number]))
                                        .map(([weightClass, athletes]) => (
                                            <React.Fragment key={`group-${weightClass}`}>
                                                {/* Weight Class Separator Row - styled as secondary */}
                                                <TableRow className="bg-secondary hover:bg-secondary">
                                                    <TableCell colSpan={7} className="py-1.5">
                                                        <span className="font-bold text-secondary-foreground text-sm">
                                                            {getLabelFromValue(weightClass, WEIGHT_CLASSES)}
                                                        </span>
                                                        <span className="text-secondary-foreground/70 ml-2 text-xs">
                                                            ({athletes.length})
                                                        </span>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Athletes */}
                                                {athletes.map((r, idx) => {
                                                    const total = r.athlete.squatBestKg + r.athlete.benchBestKg + r.athlete.deadliftBestKg;
                                                    return (
                                                        <TableRow key={r.id}>
                                                            <TableCell>
                                                                <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                                                                <span className="font-medium">{r.athlete.fullName}</span>
                                                            </TableCell>
                                                            <TableCell className="text-center text-muted-foreground">
                                                                {r.athlete.birthYear}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {r.teamName}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">
                                                                {formatWeight(r.athlete.squatBestKg)}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">
                                                                {formatWeight(r.athlete.benchBestKg)}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums">
                                                                {formatWeight(r.athlete.deadliftBestKg)}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums font-bold">
                                                                {total > 0 ? total : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })
            )}

            {/* Filters at bottom - smaller and subtle */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Filtros:</span>

                <Select value={division || 'all'} onValueChange={(v) => setDivision(v === 'all' ? null : v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue placeholder="División" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {availableOptions.divisions.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={modality || 'all'} onValueChange={(v) => setModality(v === 'all' ? null : v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue placeholder="Modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {availableOptions.modalities.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={equipment || 'all'} onValueChange={(v) => setEquipment(v === 'all' ? null : v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue placeholder="Equipamiento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableOptions.equipments.map(e => (
                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={gender || 'all'} onValueChange={(v) => setGender(v === 'all' ? null : v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue placeholder="Género" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableOptions.genders.map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setDivision(null);
                            setModality(null);
                            setEquipment(null);
                            setGender(null);
                            setSearch(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition underline"
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
}
