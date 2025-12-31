"use client"

import { useState } from "react"
import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"
import { EQUIPMENT, MODALITIES, TOURNAMENT_DIVISION } from "@acme/shared/constants"
import { Button } from "@acme/ui/button"

export type ModalityInstance = {
    equipment: 'classic' | 'equipped'
    modality: 'full' | 'bench'
    division: string
}

interface ModalitySelectorProps {
    onGenerate: (instances: ModalityInstance[]) => void
}

export function ModalitySelector({ onGenerate }: ModalitySelectorProps) {
    const [selectedEquipments, setSelectedEquipments] = useState<string[]>(['classic'])
    const [selectedModalities, setSelectedModalities] = useState<string[]>(['full'])
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>(TOURNAMENT_DIVISION.map(d => d.value))

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
            for (const mod of selectedModalities) {
                for (const div of selectedDivisions) {
                    instances.push({
                        equipment: eq as any,
                        modality: mod as any,
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
                <Label className="text-base font-semibold">2. Modalidad</Label>
                <div className="flex flex-wrap gap-4">
                    {MODALITIES.map(m => (
                        <div key={m.value} className="flex items-center space-x-2">
                            <Switch
                                id={`mod-${m.value}`}
                                checked={selectedModalities.includes(m.value)}
                                onCheckedChange={() => toggle(selectedModalities, setSelectedModalities, m.value)}
                            />
                            <Label htmlFor={`mod-${m.value}`}>{m.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-base font-semibold">3. Divisiones</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    {TOURNAMENT_DIVISION.map(d => (
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
                    Generar Previsualización ({selectedEquipments.length * selectedModalities.length * selectedDivisions.length} instancias)
                </Button>
            </div>
        </div>
    )
}
