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
import { EQUIPMENT, MODALITIES, TOURNAMENT_DIVISION } from "@acme/shared/constants"

import { ModalitySelector, type ModalityInstance } from "./modality-selector"
import { Badge } from "@acme/ui/badge"
import { ScrollArea } from "@acme/ui/scroll-area"

import { Label } from "@acme/ui/label"

export function CreateTournamentDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'event' | 'modalities' | 'confirmation'>('event')
    const [eventData, setEventData] = useState<z.input<typeof eventValidator> | null>(null)
    const [instances, setInstances] = useState<ModalityInstance[]>([])

    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createTransaction = useMutation(
        trpc.tournaments.createEventWithTournaments.mutationOptions({
            onSuccess: async () => {
                toast.success("Evento y modalidades creados exitosamente")
                setOpen(false)
                resetAll()
                void queryClient.invalidateQueries(trpc.tournaments.allEvents.pathFilter())
                router.refresh()
            },
            onError: (err: any) => {
                toast.error(err.message)
            }
        })
    )

    const resetAll = () => {
        setStep('event')
        setEventData(null)
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
            setEventData(value)
            setStep('modalities')
        },
    })

    const handleConfirmFullAction = () => {
        if (!eventData) return
        if (instances.length === 0) {
            toast.error("Debes seleccionar al menos una modalidad para el evento")
            setStep('modalities')
            return
        }
        createTransaction.mutate({
            event: eventData,
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
            <DialogContent className="sm:max-w-[700px] overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'event' ? 'Crear Evento' : step === 'modalities' ? 'Configurar Modalidades' : 'Confirmar Creación'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'event'
                            ? 'Paso 1: Define los datos logísticos del evento.'
                            : step === 'modalities'
                                ? `Paso 2: Activa las modalidades competitivas para "${eventData?.name}".`
                                : 'Paso 3: Revisa los detalles finales antes de organizar el evento.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {step === 'event' && (
                        <form
                            id="event-form"
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
                        </form>
                    )}

                    {step === 'modalities' && (
                        <div className="space-y-6">
                            <ModalitySelector onGenerate={setInstances} />
                        </div>
                    )}

                    {step === 'confirmation' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Datos del Evento</h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="font-medium">Nombre:</span>
                                    <span>{eventData?.name}</span>
                                    <span className="font-medium">Sede:</span>
                                    <span>{eventData?.venue} ({eventData?.location})</span>
                                    <span className="font-medium">Fechas:</span>
                                    <span>{dayjs(eventData?.startDate).format('DD/MM/YYYY')} - {dayjs(eventData?.endDate).format('DD/MM/YYYY')}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Instancias a crear ({instances.length})</Label>
                                <ScrollArea className="h-[250px] rounded-md border bg-background">
                                    <div className="p-3 divide-y">
                                        {instances.map((ins, i) => (
                                            <div key={i} className="py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                                                <span className="font-medium text-foreground capitalize">{MODALITIES.find(m => m.value === ins.modality)?.label}</span>
                                                <span>•</span>
                                                <span className="capitalize">{EQUIPMENT.find(e => e.value === ins.equipment)?.label}</span>
                                                <span>•</span>
                                                <span>{TOURNAMENT_DIVISION.find(d => d.value === ins.division)?.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                                <p className="font-medium">¿Estás seguro? Se crearán {instances.length} torneos asociados a este evento.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 pt-2 bg-muted/5 border-t">
                    {step === 'event' && (
                        <Button
                            type="submit"
                            form="event-form"
                            disabled={createTransaction.isPending}
                        >
                            Siguiente
                        </Button>
                    )}

                    {step === 'modalities' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('event')}
                                disabled={createTransaction.isPending}
                            >
                                Volver
                            </Button>
                            <Button
                                onClick={() => setStep('confirmation')}
                                disabled={createTransaction.isPending}
                            >
                                Previsualizar {instances.length} Modalidades
                            </Button>
                        </>
                    )}

                    {step === 'confirmation' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setStep('modalities')}
                                disabled={createTransaction.isPending}
                            >
                                Volver
                            </Button>
                            <Button
                                onClick={handleConfirmFullAction}
                                disabled={createTransaction.isPending}
                            >
                                {createTransaction.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirmar y Organizar Evento
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
