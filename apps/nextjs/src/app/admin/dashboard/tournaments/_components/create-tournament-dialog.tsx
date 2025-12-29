"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@acme/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@acme/ui/dialog"
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@acme/ui/field"
import { Input } from "@acme/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@acme/ui/select"
import { toast } from "@acme/ui/toast"
import { useTRPC } from "~/trpc/react"
import { tournamentValidator } from "@acme/shared/validators"
import { DatePicker } from "~/app/_components/time-picker/picker"
import { tournamentStatusEnum } from "@acme/db/schema"
import { env } from "~/env"
import * as z from "zod/v4"
import { dayjs } from "@acme/shared/libs"
import { ATHLETE_DIVISION, EVENTS, EQUIPMENT, TOURNAMENT_STATUS } from "@acme/shared/constants"

import { ModalitySelector, type ModalityInstance } from "./modality-selector"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"

import { Label } from "@acme/ui/label"

export function CreateTournamentDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'root' | 'modalities'>('root')
    const [rootTournament, setRootTournament] = useState<{ id: string, name: string } | null>(null)
    const [instances, setInstances] = useState<ModalityInstance[]>([])

    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createTournament = useMutation(
        trpc.tournaments.create.mutationOptions({
            onSuccess: async (data: any) => {
                toast.success("Evento principal creado. Ahora define las modalidades.")
                // Hack to access data since tRPC types might be lagging
                const id = Array.isArray(data) ? data[0]?.id : (data as any)?.id;
                const name = Array.isArray(data) ? data[0]?.name : (data as any)?.name;
                setRootTournament({ id, name })
                setStep('modalities')
                await queryClient.invalidateQueries(trpc.tournaments.all.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const createInstances = useMutation(
        (trpc.tournaments as any).createInstances.mutationOptions({
            onSuccess: async () => {
                toast.success("Modalidades generadas exitosamente")
                setOpen(false)
                resetAll()
                router.refresh()
                await queryClient.invalidateQueries(trpc.tournaments.all.pathFilter())
            },
            onError: (err: any) => {
                toast.error(err.message)
            }
        })
    )

    const resetAll = () => {
        setStep('root')
        setRootTournament(null)
        setInstances([])
        form.reset()
    }

    const defaultValues: z.input<typeof tournamentValidator> = {
        name: "",
        venue: "",
        location: "",
        maxAthletes: 0 as number | null,
        startDate: dayjs().toDate(),
        endDate: dayjs().toDate(),
        status: "preliminary_open",
        division: "open",
        event: "full",
        equipment: "classic",
    }

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: tournamentValidator,
        },
        onSubmit: ({ value }) => {
            createTournament.mutate(value)
        },
    })

    const handleGenerateInstances = () => {
        if (!rootTournament) return
        (createInstances.mutate as any)({
            parentId: rootTournament.id,
            modalities: instances
        })
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetAll()
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Torneo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{step === 'root' ? 'Crear Evento Principal' : 'Generar Modalidades'}</DialogTitle>
                    <DialogDescription>
                        {step === 'root'
                            ? 'Paso 1: Define la logística general del torneo.'
                            : `Paso 2: Selecciona las modalidades para "${rootTournament?.name}".`}
                    </DialogDescription>
                </DialogHeader>

                {step === 'root' ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void form.handleSubmit()
                        }}
                        className="space-y-4"
                    >
                        <FieldGroup>
                            <form.Field
                                name="name"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Nombre del Torneo</FieldLabel>
                                            </FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="Ej: Campeonato Nacional 2025"
                                                aria-invalid={isInvalid}
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    )
                                }}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <form.Field
                                    name="venue"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Sede</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="Ej: Hotel portal del lago"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                                <form.Field
                                    name="location"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Ubicación</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                    placeholder="Ej: Villa Carlos Paz, Córdoba, Argentina"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <form.Field
                                    name="startDate"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid} className="flex flex-col">
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Fecha de Inicio</FieldLabel>
                                                </FieldContent>
                                                <DatePicker
                                                    date={field.state.value}
                                                    setDate={(date) => field.handleChange(date as Date)}
                                                    label="Seleccionar fecha inicio"
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                                <form.Field
                                    name="endDate"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid} className="flex flex-col">
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Fecha de Fin</FieldLabel>
                                                </FieldContent>
                                                <DatePicker
                                                    date={field.state.value}
                                                    setDate={(date) => field.handleChange(date as Date)}
                                                    label="Seleccionar fecha fin"
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <form.Field
                                    name="maxAthletes"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Max. Atletas (Default)</FieldLabel>
                                                </FieldContent>
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="number"
                                                    value={field.state.value ?? ""}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        const val = e.target.valueAsNumber;
                                                        field.handleChange(isNaN(val) ? null : val)
                                                    }}
                                                    placeholder="0"
                                                    aria-invalid={isInvalid}
                                                />
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                                <form.Field
                                    name="status"
                                    children={(field) => {
                                        const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <FieldContent>
                                                    <FieldLabel htmlFor={field.name}>Estado Inicial</FieldLabel>
                                                </FieldContent>
                                                <Select
                                                    value={field.state.value}
                                                    onValueChange={(val: any) => field.handleChange(val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione estado" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TOURNAMENT_STATUS.map(s => (
                                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                            </Field>
                                        )
                                    }}
                                />
                            </div>
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="submit" disabled={createTournament.isPending}>
                                {createTournament.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente (Configurar Modalidades)
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <ModalitySelector onGenerate={setInstances} />

                        {instances.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Resumen de instancias a crear ({instances.length})</Label>
                                <ScrollArea className="h-[200px] rounded-md border p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {instances.map((ins, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {ins.equipment} - {ins.event} - {ATHLETE_DIVISION.find(d => d.value === ins.division)?.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setStep('root')} disabled={createInstances.isPending}>
                                Volver
                            </Button>
                            <Button
                                onClick={handleGenerateInstances}
                                disabled={createInstances.isPending || instances.length === 0}
                            >
                                {createInstances.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Generar {instances.length} Modalidades
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
