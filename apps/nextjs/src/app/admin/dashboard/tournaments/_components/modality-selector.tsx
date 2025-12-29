"use client"

import { useState } from "react"
import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"
import { EQUIPMENT, EVENTS, ATHLETE_DIVISION } from "@acme/shared/constants"
import { Button } from "@acme/ui/button"

export type ModalityInstance = {
    equipment: 'classic' | 'equipped'
    event: 'full' | 'bench'
    division: string
}

interface ModalitySelectorProps {
    onGenerate: (instances: ModalityInstance[]) => void
}

export function ModalitySelector({ onGenerate }: ModalitySelectorProps) {
    const [selectedEquipments, setSelectedEquipments] = useState<string[]>(['classic'])
    const [selectedEvents, setSelectedEvents] = useState<string[]>(['full'])
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>(ATHLETE_DIVISION.map(d => d.value))

    const toggle = (list: string[], setList: (l: string[]) => void, value: string) => {
        if (list.includes(value)) {
            setList(list.filter(v => v !== value))
        } else {
            setList([...list, value])
        }
    }

    const generate = () => {
        const instances: ModalityInstance[] = []
        for (const eq of selectedEquipments) {
            for (const ev of selectedEvents) {
                for (const div of selectedDivisions) {
                    instances.push({
                        equipment: eq as any,
                        event: ev as any,
                        division: div
                    })
                }
            }
        }
        onGenerate(instances)
    }

    return (
        <div className="space-y-6 py-4">
            <div className="space-y-3">
                <Label className="text-base font-semibold">1. Equipamiento</Label>
                <div className="flex flex-wrap gap-4">
                    {EQUIPMENT.map(e => (
                        <div key={e.value} className="flex items-center space-x-2">
                            <Switch
                                id={`eq-${e.value}`}
                                checked={selectedEquipments.includes(e.value)}
                                onCheckedChange={() => toggle(selectedEquipments, setSelectedEquipments, e.value)}
                            />
                            <Label htmlFor={`eq-${e.value}`}>{e.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-base font-semibold">2. Evento</Label>
                <div className="flex flex-wrap gap-4">
                    {EVENTS.map(e => (
                        <div key={e.value} className="flex items-center space-x-2">
                            <Switch
                                id={`ev-${e.value}`}
                                checked={selectedEvents.includes(e.value)}
                                onCheckedChange={() => toggle(selectedEvents, setSelectedEvents, e.value)}
                            />
                            <Label htmlFor={`ev-${e.value}`}>{e.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-base font-semibold">3. Divisiones</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    {ATHLETE_DIVISION.map(d => (
                        <div key={d.value} className="flex items-center space-x-2">
                            <Switch
                                id={`div-${d.value}`}
                                checked={selectedDivisions.includes(d.value)}
                                onCheckedChange={() => toggle(selectedDivisions, setSelectedDivisions, d.value)}
                            />
                            <Label htmlFor={`div-${d.value}`} className="text-sm">{d.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={generate} variant="secondary">
                    Generar Previsualización ({selectedEquipments.length * selectedEvents.length * selectedDivisions.length} instancias)
                </Button>
            </div>
        </div>
    )
}
