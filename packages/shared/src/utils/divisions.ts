export function getAthleteDivision(birthYear: number): string {
    const currentYear = new Date().getFullYear();
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
    const currentYear = new Date().getFullYear();
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

export function getEligibleWeightClasses(gender: "M" | "F", division?: string): string[] {
    const weights = gender === "M"
        ? [
            "M_CAT53", "M_CAT59", "M_CAT66", "M_CAT74", "M_CAT83",
            "M_CAT93", "M_CAT105", "M_CAT120", "M_CATHW"
        ]
        : [
            "F_CAT43", "F_CAT47", "F_CAT52", "F_CAT57", "F_CAT63", "F_CAT69",
            "F_CAT76", "F_CAT84", "F_CATHW"
        ];

    // Filter restricted classes logic
    // M_CAT53 and F_CAT43 are ONLY available for SubJunior and Junior divisions.
    // If division is NOT subjunior or junior, remove them.
    if (division) {
        const isSubJuniorOrJunior = division === "subjunior" || division === "junior";
        if (!isSubJuniorOrJunior) {
            return weights.filter(w => w !== "M_CAT53" && w !== "F_CAT43");
        }
    }

    return weights;
}
