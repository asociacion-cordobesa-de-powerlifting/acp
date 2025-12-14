import { TournamentStatusEnum } from "@acme/db/schema"

type Selection<Enum> = {
    label: string,
    value: Enum
    className?: string
}

export const DEFAULT_USER_IMAGE = "https://i0.wp.com/www.stignatius.co.uk/wp-content/uploads/2020/10/default-user-icon.jpg?fit=415%2C415&ssl=1"

export const TOURNAMENT_STATUS: Selection<TournamentStatusEnum>[] = [
    { label: "Borrador", value: "draft" },
    { label: "Preliminar Abierto", value: "preliminary_open" },
    { label: "Preliminar Cerrado", value: "preliminary_closed" },
    { label: "Finalizado", value: "finished" },
]