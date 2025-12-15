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
