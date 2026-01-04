import { dayjs } from "../lib";

export interface PlainAthlete {
    gender: "M" | "F";
    birthYear: number;
}

export interface PlainTournament {
    id: string;
    division: "juniors" | "open" | "masters";
    modality: "full" | "bench";
    equipment: "classic" | "equipped";
}

/**
 * Returns eligible weight classes for an athlete in a specific tournament.
 */
export function getEligibleWeightClasses(
    athlete: PlainAthlete,
    tournament: PlainTournament
): string[] {
    const weights = athlete.gender === "M"
        ? [
            "M_CAT53", "M_CAT59", "M_CAT66", "M_CAT74", "M_CAT83",
            "M_CAT93", "M_CAT105", "M_CAT120", "M_CATHW"
        ]
        : [
            "F_CAT43", "F_CAT47", "F_CAT52", "F_CAT57", "F_CAT63", "F_CAT69",
            "F_CAT76", "F_CAT84", "F_CATHW"
        ];

    const currentYear = dayjs().year();
    const age = currentYear - athlete.birthYear;

    // Special Rule: M_CAT53 and F_CAT43 only for athletes with age <= 23 (Subjuniors/Juniors)
    if (age > 23) {
        return weights.filter(w => w !== "M_CAT53" && w !== "F_CAT43");
    }

    return weights;
}

/**
 * Filters which tournaments an athlete can participate in based on age rules.
 */
export function getEligibleTournaments(
    athlete: PlainAthlete,
    allEventTournaments: PlainTournament[]
): PlainTournament[] {
    const currentYear = dayjs().year();
    const age = currentYear - athlete.birthYear;

    return allEventTournaments.filter(t => {
        if (t.division === "juniors") {
            return age <= 23;
        }
        if (t.division === "masters") {
            return age >= 40;
        }
        if (t.division === "open") {
            return age >= 20; // Corrected rule: must be 20+ to enter Open
        }
        return false;
    });
}

/**
 * Finds if there is an 'open' counterpart for a given tournament
 * (same modality and equipment but division: 'open').
 */
export function getOpenCounterpart(
    currentTournament: PlainTournament,
    allEventTournaments: PlainTournament[]
): PlainTournament | undefined {
    // If it's already an open tournament, return undefined (no counterpart needed for itself in this logic context)
    if (currentTournament.division === "open") return undefined;

    return allEventTournaments.find(t =>
        t.division === "open" &&
        t.modality === currentTournament.modality &&
        t.equipment === currentTournament.equipment &&
        t.id !== currentTournament.id
    );
}

/**
 * Matches a specific tournament within an event based on modality, equipment, and athlete age.
 */
export function matchTournament(
    athlete: PlainAthlete,
    modality: "full" | "bench",
    equipment: "classic" | "equipped",
    allEventTournaments: PlainTournament[]
): PlainTournament | undefined {
    const currentYear = dayjs().year();
    const age = currentYear - athlete.birthYear;

    // Determine target division
    let targetDivision: "juniors" | "masters" | "open";
    if (age <= 23) {
        targetDivision = "juniors";
    } else if (age >= 40) {
        targetDivision = "masters";
    } else {
        targetDivision = "open";
    }

    // Try to find exact match
    let match = allEventTournaments.find(t =>
        t.modality === modality &&
        t.equipment === equipment &&
        t.division === targetDivision
    );

    // Fallback to Open if specific age division is not available AND age >= 20
    if (!match && targetDivision !== "open" && age >= 20) {
        match = allEventTournaments.find(t =>
            t.modality === modality &&
            t.equipment === equipment &&
            t.division === "open"
        );
    }

    return match;
}

/**
 * Helper to determine if an athlete is eligible for 'Open' registration
 */
export function canAthleteEnterOpen(athlete: PlainAthlete): boolean {
    const currentYear = dayjs().year();
    const age = currentYear - athlete.birthYear;
    // Rule: must be 20+ to enter Open
    return age >= 20;
}
