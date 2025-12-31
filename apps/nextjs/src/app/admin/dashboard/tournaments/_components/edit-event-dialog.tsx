"use client"

import { useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@acme/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Switch } from "@acme/ui/switch"
import { Label } from "@acme/ui/label"
import { toast } from "@acme/ui/toast"
import { useTRPC } from "~/trpc/react"
import { eventValidator, baseEventSchema } from "@acme/shared/validators"
import { DatePicker } from "~/app/_components/time-picker/picker"
import { RouterOutputs } from "@acme/api"
import { TOURNAMENT_STATUS } from "@acme/shared/constants"
import { dayjs } from "@acme/shared/libs"
import * as z from "zod/v4"

type EventWithTournaments = RouterOutputs["tournaments"]["allEvents"][number]

interface EditEventDialogProps {
    event: EventWithTournaments
    open: boolean
    onOpenChange: (open: boolean) => void
}

const EditEventDialogSchema = baseEventSchema.extend({
    id: z.string().uuid(),
    propagateStatus: z.enum(['preliminary_open', 'preliminary_closed', 'finished']).optional(),
})

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
    const router = useRouter()
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [shouldPropagate, setShouldPropagate] = useState(false)

    const updateEvent = useMutation(
        trpc.tournaments.updateEvent.mutationOptions({
            onSuccess: async () => {
                toast.success("Evento actualizado exitosamente")
                onOpenChange(false)
                router.refresh()
                await queryClient.invalidateQueries(trpc.tournaments.allEvents.pathFilter())
            },
            onError: (err) => {
                toast.error(err.message)
            },
        })
    )

    const defaultValues: z.input<typeof EditEventDialogSchema> = {
        id: event.id,
        name: event.name,
        venue: event.venue,
        location: event.location,
        startDate: dayjs(event.startDate).toDate(),
        endDate: dayjs(event.endDate).toDate(),
        propagateStatus: undefined,
    }

    const form = useForm({
        defaultValues,
        validators: {
            onSubmit: EditEventDialogSchema,
        },
        onSubmit: ({ value }) => {
            const payload = { ...value };
            if (!shouldPropagate) {
                delete payload.propagateStatus;
            }
            updateEvent.mutate(payload)
        },
    })

    useEffect(() => {
        if (open) {
            form.reset(defaultValues)
            setShouldPropagate(false)
        }
    }, [event, open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Evento</DialogTitle>
                    <DialogDescription>
                        Actualice los datos logísticos del evento. Los cambios se reflejarán en todas las modalidades.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void form.handleSubmit()
                    }}
                    className="space-y-6"
                >
                    <FieldGroup>
                        <form.Field
                            name="name"
                            children={(field) => (
                                <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                                    <FieldContent>
                                        <FieldLabel htmlFor={field.name}>Nombre del Evento</FieldLabel>
                                    </FieldContent>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Ej: Open Nacional 2025"
                                    />
                                    <FieldError errors={field.state.meta.errors} />
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="venue"
                                children={(field) => (
                                    <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Sede</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <FieldError errors={field.state.meta.errors} />
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="location"
                                children={(field) => (
                                    <Field data-invalid={field.state.meta.isTouched && !!field.state.meta.errors.length}>
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Ubicación</FieldLabel>
                                        </FieldContent>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <FieldError errors={field.state.meta.errors} />
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="startDate"
                                children={(field) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Fecha Inicio</FieldLabel>
                                        </FieldContent>
                                        <DatePicker
                                            date={field.state.value as Date}
                                            setDate={(date) => field.handleChange(date as Date)}
                                            label="Seleccionar fecha"
                                        />
                                        <FieldError errors={field.state.meta.errors} />
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="endDate"
                                children={(field) => (
                                    <Field className="flex flex-col gap-2">
                                        <FieldContent>
                                            <FieldLabel htmlFor={field.name}>Fecha Fin</FieldLabel>
                                        </FieldContent>
                                        <DatePicker
                                            date={field.state.value as Date}
                                            setDate={(date) => field.handleChange(date as Date)}
                                            label="Seleccionar fecha"
                                        />
                                        <FieldError errors={field.state.meta.errors} />
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Propagar Estado</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Actualizar el estado de todas las modalidades asociadas.
                                    </p>
                                </div>
                                <Switch
                                    checked={shouldPropagate}
                                    onCheckedChange={setShouldPropagate}
                                />
                            </div>

                            {shouldPropagate && (
                                <form.Field
                                    name="propagateStatus"
                                    children={(field) => (
                                        <Field>
                                            <FieldContent>
                                                <FieldLabel htmlFor={field.name}>Nuevo Estado</FieldLabel>
                                            </FieldContent>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={(val: any) => field.handleChange(val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TOURNAMENT_STATUS.map(s => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FieldError errors={field.state.meta.errors} />
                                        </Field>
                                    )}
                                />
                            )}
                        </div>
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="submit" disabled={updateEvent.isPending}>
                            {updateEvent.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
