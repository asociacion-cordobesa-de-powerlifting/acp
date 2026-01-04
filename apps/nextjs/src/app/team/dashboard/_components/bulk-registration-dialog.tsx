"use client"

import { useState, useMemo } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@acme/ui/dialog"
import { Button } from "@acme/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { useTRPC } from "~/trpc/react"
import { toast } from "@acme/ui/toast"
import { weightClassEnum } from "@acme/db/schema"
import { canAthleteParticipateIn, getEligibleWeightClasses } from "@acme/shared"
import { WEIGHT_CLASSES } from "@acme/shared/constants"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@acme/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover"
import { cn } from "@acme/ui"

interface BulkRegistrationDialogProps {
    tournament: {
        id: string
        division: string
        modality: string
        equipment: string
        status: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

type RegistrationEntry = {
    athleteId: string
    weightClass: string
}

export function BulkRegistrationDialog({
    tournament,
    open,
    onOpenChange
}: BulkRegistrationDialogProps) {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const [selectedEntries, setSelectedEntries] = useState<RegistrationEntry[]>([])
    const [openPicker, setOpenPicker] = useState(false)

    const { data: athletes = [] } = useQuery(trpc.athletes.list.queryOptions())
    const { data: teamRegistrations = [] } = useQuery(trpc.registrations.byTeam.queryOptions())

    const bulkRegister = useMutation(
        trpc.registrations.bulkRegister.mutationOptions({
            onSuccess: async () => {
                toast.success("Inscripciones realizadas con éxito")
                await queryClient.invalidateQueries(trpc.registrations.byTeam.pathFilter())
                setSelectedEntries([])
                onOpenChange(false)
            },
            onError: (err) => {
                toast.error(err.message)
            }
        })
    )

    // Pre-calculate if an athlete is already in this tournament
    const isAlreadyRegistered = (athleteId: string) => {
        return teamRegistrations.some(r => r.athleteId === athleteId && r.tournamentId === tournament.id && !r.deletedAt)
    }

    const addAthlete = (athleteId: string) => {
        if (selectedEntries.some(e => e.athleteId === athleteId)) return

        const a = athletes.find(a => a.id === athleteId)
        if (!a) return

        // Default weight class: first eligible one
        const eligible = getEligibleWeightClasses(a.gender as any, a.birthYear, tournament.division as any)

        setSelectedEntries([...selectedEntries, {
            athleteId,
            weightClass: eligible[0] ?? ""
        }])
        setOpenPicker(false)
    }

    const removeAthlete = (athleteId: string) => {
        setSelectedEntries(selectedEntries.filter(e => e.athleteId !== athleteId))
    }

    const updateWeightClass = (athleteId: string, weightClass: string) => {
        setSelectedEntries(selectedEntries.map(e =>
            e.athleteId === athleteId ? { ...e, weightClass } : e
        ))
    }

    const handleSubmit = () => {
        if (selectedEntries.length === 0) return
        bulkRegister.mutate({
            tournamentId: tournament.id,
            registrations: selectedEntries.map(e => ({
                athleteId: e.athleteId,
                weightClass: e.weightClass as any
            }))
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Inscripción Masiva</DialogTitle>
                    <DialogDescription>
                        Selecciona los atletas de tu equipo para inscribirlos en este torneo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
                    <div className="flex items-center gap-4">
                        <Popover open={openPicker} onOpenChange={setOpenPicker}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Buscar y agregar atletas...
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Nombre del atleta..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontraron atletas.</CommandEmpty>
                                        <CommandGroup>
                                            {athletes.filter(a => !selectedEntries.some(e => e.athleteId === a.id)).map((a) => {
                                                const alreadyReg = isAlreadyRegistered(a.id)
                                                const canParticipate = canAthleteParticipateIn(a.birthYear, tournament.division as any)

                                                return (
                                                    <CommandItem
                                                        key={a.id}
                                                        disabled={alreadyReg || !canParticipate}
                                                        onSelect={() => addAthlete(a.id)}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{a.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {a.gender} • {a.birthYear}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {alreadyReg && (
                                                                <Badge variant="secondary" className="text-[9px]">Inscripto</Badge>
                                                            )}
                                                            {!canParticipate && (
                                                                <Badge variant="destructive" className="text-[9px]">Edad no válida</Badge>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                )
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex-1 overflow-hidden border rounded-md">
                        <ScrollArea className="h-full">
                            {selectedEntries.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No hay atletas seleccionados.
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">Atleta</th>
                                            <th className="text-left p-3 font-medium">Categoría</th>
                                            <th className="w-10 p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedEntries.map((entry) => {
                                            const a = athletes.find(at => at.id === entry.athleteId)
                                            if (!a) return null
                                            const eligible = getEligibleWeightClasses(a.gender as any, a.birthYear, tournament.division as any)

                                            return (
                                                <tr key={entry.athleteId}>
                                                    <td className="p-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{a.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground lowercase">
                                                                {a.gender === 'M' ? 'Masculino' : 'Femenino'} • {a.birthYear}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Select
                                                            value={entry.weightClass}
                                                            onValueChange={(val) => updateWeightClass(entry.athleteId, val)}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {eligible.map(w => (
                                                                    <SelectItem key={w} value={w}>
                                                                        {WEIGHT_CLASSES.find(wc => wc.value === w)?.label ?? w}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="p-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeAthlete(entry.athleteId)}
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedEntries.length === 0 || bulkRegister.isPending}
                    >
                        {bulkRegister.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Inscribir {selectedEntries.length} Atletas
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
