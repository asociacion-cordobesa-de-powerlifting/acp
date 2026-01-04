import { Selection } from '.';
import { registrationStatusEnum } from './../../db/src/schema';
import type { DivisionEnum, EquipmentEnum, ModalityEnum, TournamentStatusEnum, WeightClassEnum, GenderEnum, TournamentDivisionEnum, RegistrationStatusEnum } from "@acme/db/schema"

export const DEFAULT_USER_IMAGE = "https://i0.wp.com/www.stignatius.co.uk/wp-content/uploads/2020/10/default-user-icon.jpg?fit=415%2C415&ssl=1"

export const ATHLETE_GENDER: Selection<GenderEnum>[] = [
    { label: "Masculino", value: "M" },
    { label: "Femenino", value: "F" },
]

export const TOURNAMENT_STATUS: Selection<TournamentStatusEnum>[] = [
    { label: "Preliminar Abierto", value: "preliminary_open" },
    { label: "Preliminar Cerrado", value: "preliminary_closed" },
    { label: "Finalizado", value: "finished" },
]

export const ATHLETE_DIVISION: Selection<DivisionEnum>[] = [
    { label: "Sub-Junior", value: "subjunior" },
    { label: "Junior", value: "junior" },
    { label: "Open", value: "open" },
    { label: "Master 1", value: "master_1" },
    { label: "Master 2", value: "master_2" },
    { label: "Master 3", value: "master_3" },
    { label: "Master 4", value: "master_4" },
]

export const WEIGHT_CLASSES_BY_GENDER: {
    M: WeightClassEnum[]
    F: WeightClassEnum[]
} = {
    M: [
        "M_CAT53", "M_CAT59", "M_CAT66", "M_CAT74", "M_CAT83", "M_CAT93", "M_CAT105", "M_CAT120", "M_CATHW"
    ],
    F: [
        "F_CAT43", "F_CAT47", "F_CAT52", "F_CAT57", "F_CAT63", "F_CAT69", "F_CAT76", "F_CAT84", "F_CATHW"
    ]
}

export const WEIGHT_CLASSES: Selection<WeightClassEnum>[] = [
    { label: "-43", value: "F_CAT43" },
    { label: "-47", value: "F_CAT47" },
    { label: "-52", value: "F_CAT52" },
    { label: "-57", value: "F_CAT57" },
    { label: "-63", value: "F_CAT63" },
    { label: "-69", value: "F_CAT69" },
    { label: "-76", value: "F_CAT76" },
    { label: "-84", value: "F_CAT84" },
    { label: "+84", value: "F_CATHW" },

    { label: "-53", value: "M_CAT53" },
    { label: "-59", value: "M_CAT59" },
    { label: "-66", value: "M_CAT66" },
    { label: "-74", value: "M_CAT74" },
    { label: "-83", value: "M_CAT83" },
    { label: "-93", value: "M_CAT93" },
    { label: "-105", value: "M_CAT105" },
    { label: "-120", value: "M_CAT120" },
    { label: "+120", value: "M_CATHW" },
]

export const DIVISION_RULES = [
    { id: "subjunior" as const, min: 14, max: 18, label: "Sub-Junior" },
    { id: "junior" as const, min: 19, max: 23, label: "Junior" },
    { id: "open" as const, min: 20, max: 999, label: "Open" }, // Special rule: >= 20
    { id: "master_1" as const, min: 40, max: 49, label: "Master 1" },
    { id: "master_2" as const, min: 50, max: 59, label: "Master 2" },
    { id: "master_3" as const, min: 60, max: 69, label: "Master 3" },
    { id: "master_4" as const, min: 70, max: 999, label: "Master 4" },
];

export const MODALITIES: Selection<ModalityEnum>[] = [
    { label: "Powerlifting", value: "full" },
    { label: "Bench Press", value: "bench" },
]

export const EQUIPMENT: Selection<EquipmentEnum>[] = [
    { label: "Raw", value: "classic" },
    { label: "Equipped", value: "equipped" },
]

export const TOURNAMENT_DIVISION: Selection<TournamentDivisionEnum>[] = [
    { label: "Juniors", value: "juniors" },
    { label: "Open", value: "open" },
    { label: "Masters", value: "masters" },
]

export const REGISTRATION_STATUS: Selection<RegistrationStatusEnum>[] = [
    { label: "Pendiente", value: "pending" },
    { label: "Aprobado", value: "approved" },
    { label: "Rechazado", value: "rejected" },
]
