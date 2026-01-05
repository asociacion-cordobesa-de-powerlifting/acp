import { dayjs } from "../lib";

export function getAthleteDivision(birthYear: number): string {
    const currentYear = dayjs().year();
    const age = currentYear - birthYear;

    if (age >= 14 && age <= 18) return "subjunior";
    if (age >= 19 && age <= 23) return "junior";
    if (age >= 40 && age <= 49) return "master_1";
    if (age >= 50 && age <= 59) return "master_2";
    if (age >= 60 && age <= 69) return "master_3";
    if (age >= 70) return "master_4";

    // Default to Open (24-39 or implied all ages if chosen, but for auto-cat: Open)
    return "open";
}

export function getEligibleDivisions(birthYear: number): string[] {
    const currentYear = dayjs().year();
    const age = currentYear - birthYear;

    const divisions: string[] = [];

    // Check specific age divisions
    if (age >= 14 && age <= 18) divisions.push("subjunior");
    if (age >= 19 && age <= 23) divisions.push("junior");
    if (age >= 40 && age <= 49) divisions.push("master_1");
    if (age >= 50 && age <= 59) divisions.push("master_2");
    if (age >= 60 && age <= 69) divisions.push("master_3");
    if (age >= 70) divisions.push("master_4");

    // Open rule: Available if age >= 20 (Wait, user said "unless he is < 20")
    // "un atleta junior puede querer inscribirse en open" -> Junior is 19-23.
    // If 19, is he allowed in Open? "unless he is less than 20". So 19 is < 20, so NO open?
    // User said: "(un atleta junior puede querer inscribirse en open), etc. despues lo desglosamos"
    // Then later: "no se puede inscribir a cualquier division: puede ser la division correspondiente a la edad o a open (a menos que sea menor de 20 años, osea si tiene 19 no puede inscribirse a open)"
    // OK, logic: IF Age >= 20 THEN Add "Open".
    // 19 year old (Junior) -> Can NOT register in Open.
    // 20 year old (Junior) -> Can register in Junior OR Open.
    if (age >= 20) {
        divisions.push("open");
    }

    return divisions;
}

export function canAthleteParticipateIn(
    birthYear: number,
    tournamentDivision: "juniors" | "open" | "masters"
): boolean {
    const currentYear = dayjs().year();
    const age = currentYear - birthYear;

    if (tournamentDivision === "juniors") {
        // Only Subjuniors (14-18) and Juniors (19-23)
        return age >= 14 && age <= 23;
    }

    if (tournamentDivision === "masters") {
        // Only Masters (40+)
        return age >= 40;
    }

    if (tournamentDivision === "open") {
        // Any athlete EXCEPT Subjuniors (14-18)
        // Juniors (>= 19), Open-aged, and Masters can enter.
        return age >= 19;
    }

    return false;
}

/**
 * Maps athlete division to tournament division (grouping).
 * 
 * Mapping:
 * - subjunior, junior → juniors
 * - open → open
 * - master_1, master_2, master_3, master_4 → masters
 */
export function mapAthleteDivisionToTournamentDivision(
    athleteDivision: "subjunior" | "junior" | "open" | "master_1" | "master_2" | "master_3" | "master_4"
): "juniors" | "open" | "masters" {
    if (athleteDivision === "subjunior" || athleteDivision === "junior") {
        return "juniors";
    }
    if (athleteDivision === "open") {
        return "open";
    }
    if (athleteDivision === "master_1" || athleteDivision === "master_2" || 
        athleteDivision === "master_3" || athleteDivision === "master_4") {
        return "masters";
    }
    // Fallback (shouldn't happen)
    return "open";
}

/**
 * Maps tournament division to athlete division based on the athlete's age.
 * 
 * This function determines the specific athlete division when they participate
 * in a tournament division (which is a grouping).
 * 
 * Examples:
 * - Tournament "juniors" → "subjunior" (14-18) or "junior" (19-23)
 * - Tournament "open" → "open" (always, regardless of athlete's age division)
 * - Tournament "masters" → "master_1" (40-49), "master_2" (50-59), "master_3" (60-69), or "master_4" (70+)
 */
export function mapTournamentDivisionToAthleteDivision(
    tournamentDivision: "juniors" | "open" | "masters",
    birthYear: number
): "subjunior" | "junior" | "open" | "master_1" | "master_2" | "master_3" | "master_4" {
    const currentYear = dayjs().year();
    const age = currentYear - birthYear;

    if (tournamentDivision === "juniors") {
        // Juniors tournament contains subjunior (14-18) and junior (19-23)
        if (age >= 14 && age <= 18) return "subjunior";
        if (age >= 19 && age <= 23) return "junior";
        // Fallback (shouldn't happen if validation is correct)
        return "junior";
    }

    if (tournamentDivision === "open") {
        // Open tournament always shows as "open" regardless of athlete's age division
        return "open";
    }

    if (tournamentDivision === "masters") {
        // Masters tournament contains master_1 (40-49), master_2 (50-59), master_3 (60-69), master_4 (70+)
        if (age >= 40 && age <= 49) return "master_1";
        if (age >= 50 && age <= 59) return "master_2";
        if (age >= 60 && age <= 69) return "master_3";
        if (age >= 70) return "master_4";
        // Fallback (shouldn't happen if validation is correct)
        return "master_1";
    }

    // Fallback (shouldn't happen)
    return "open";
}

