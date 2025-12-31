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
import { toast } from "@acme/ui/toast"
import { useTRPC } from "~/trpc/react"
import { eventValidator } from "@acme/shared/validators"
import { DatePicker } from "~/app/_components/time-picker/picker"
import * as z from "zod/v4"
import { dayjs } from "@acme/shared/libs"
import { TOURNAMENT_DIVISION } from "@acme/shared/constants"

import { ModalitySelector, type ModalityInstance } from "./modality-selector"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"

import { Label } from "@acme/ui/label"

export function CreateTournamentDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'event' | 'modalities'>('event')
    const [rootEvent, setRootEvent] = useState<{ id: string, name: string } | null>(null)
    const [instances, setInstances] = useState<ModalityInstance[]>([])

    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createEvent = useMutation(
        trpc.tournaments.createEvent.mutationOptions({
            onSuccess: async (data: any) => {
                toast.success("Evento creado. Ahora configura las modalidades.")
                setRootEvent({ id: data.id, name: data.name })
                setStep('modalities')
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const createTournaments = useMutation(
        trpc.tournaments.createTournaments.mutationOptions({
            onSuccess: async () => {
                toast.success("Modalidades generadas exitosamente")
                setOpen(false)
                resetAll()
                router.refresh()
            },
            onError: (err: any) => {
                toast.error(err.message)
            }
        })
    )

    const resetAll = () => {
        setStep('event')
        setRootEvent(null)
        setInstances([])
        form.reset()
    }

    const defaultValues: z.input<typeof eventValidator> = {
        name: "",
        venue: "",
        location: "",
        startDate: dayjs().toDate(),
        endDate: dayjs().toDate(),
    }

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: eventValidator,
        },
        onSubmit: ({ value }) => {
            createEvent.mutate(value)
        },
    })

    const handleGenerateInstances = () => {
        if (!rootEvent) return
        createTournaments.mutate({
            eventId: rootEvent.id,
            modalities: instances.map(ins => ({
                ...ins,
                division: ins.division as any,
            }))
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
                    Organizar evento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{step === 'event' ? 'Crear Evento' : 'Configurar Modalidades'}</DialogTitle>
                    <DialogDescription>
                        {step === 'event'
                            ? 'Paso 1: Define los datos logísticos del evento.'
                            : `Paso 2: Activa las modalidades competitivas para "${rootEvent?.name}".`}
                    </DialogDescription>
                </DialogHeader>

                {step === 'event' ? (
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
                                                <FieldLabel htmlFor={field.name}>Nombre del Evento</FieldLabel>
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
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="submit" disabled={createEvent.isPending}>
                                {createEvent.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6">

                        <ModalitySelector onGenerate={setInstances} />

                        {instances.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Resumen de modalidades a activar ({instances.length})</Label>
                                <ScrollArea className="h-[200px] rounded-md border p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {instances.map((ins, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {ins.equipment} - {ins.modality} - {TOURNAMENT_DIVISION.find(d => d.value === ins.division)?.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setStep('event')} disabled={createTournaments.isPending}>
                                Volver
                            </Button>
                            <Button
                                onClick={handleGenerateInstances}
                                disabled={createTournaments.isPending || instances.length === 0}
                            >
                                {createTournaments.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Activar {instances.length} Modalidades
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
