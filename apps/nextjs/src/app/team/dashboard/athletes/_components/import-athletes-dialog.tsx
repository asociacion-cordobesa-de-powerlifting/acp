"use client"

import { useState } from "react"
import { Loader2, Download, Upload, FileSpreadsheet, X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@acme/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@acme/ui/dialog"
import { toast } from "@acme/ui/toast"
import { useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "~/trpc/react"
import { cn } from "@acme/ui"
import { ScrollArea } from "@acme/ui/scroll-area"

interface ImportResult {
    success: boolean;
    inserted: number;
    total: number;
    validationErrors: string[];
    insertErrors: string[];
}

export function ImportAthletesDialog() {
    const [open, setOpen] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const queryClient = useQueryClient()
    const trpc = useTRPC()

    const handleDownloadTemplate = async () => {
        setIsDownloading(true)
        try {
            const response = await fetch('/api/athletes/template')
            if (!response.ok) {
                throw new Error('Error al descargar plantilla')
            }
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'plantilla_atletas.xlsx'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            a.remove()
            toast.success("Plantilla descargada")
        } catch (error) {
            toast.error("Error al descargar plantilla")
        } finally {
            setIsDownloading(false)
        }
    }

    const handleFileUpload = async (file?: File) => {
        if (!file) return

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ]
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error("Archivo inválido. Solo se permiten archivos Excel (.xlsx, .xls)")
            return
        }

        setIsUploading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/athletes/import', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                if (data.details) {
                    setResult({
                        success: false,
                        inserted: 0,
                        total: 0,
                        validationErrors: data.details,
                        insertErrors: [],
                    })
                } else {
                    toast.error(data.error || 'Error al importar')
                }
                return
            }

            setResult(data)

            if (data.inserted > 0) {
                await queryClient.invalidateQueries(trpc.athletes.list.pathFilter())
                toast.success(`${data.inserted} atletas importados exitosamente`)
            }
        } catch (error) {
            toast.error("Error al procesar archivo")
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setResult(null)
    }

    const hasErrors = result && (result.validationErrors.length > 0 || result.insertErrors.length > 0)
    const allErrors = [...(result?.validationErrors || []), ...(result?.insertErrors || [])]

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose()
            else setOpen(true)
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Importar Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importar Atletas desde Excel</DialogTitle>
                    <DialogDescription>
                        Puedes importar atletas masivamente desde un archivo Excel. Descargá la plantilla, completá los datos y sube el archivo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Download className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Descargar Plantilla</p>
                                <p className="text-xs text-muted-foreground">Archivo Excel con formato correcto</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Descargar"
                            )}
                        </Button>
                    </div>

                    {/* Upload File */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Upload className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium">Subir Archivo</p>
                                <p className="text-xs text-muted-foreground">Sube el Excel con los datos completados</p>
                            </div>
                        </div>

                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                                isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50",
                                isUploading && "opacity-50 cursor-not-allowed"
                            )}
                            onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!isUploading) setIsDragging(true)
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(false)
                            }}
                            onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDragging(false)
                                if (!isUploading) {
                                    const file = e.dataTransfer.files[0]
                                    handleFileUpload(file)
                                }
                            }}
                            onClick={() => {
                                if (!isUploading) {
                                    const input = document.getElementById('import-file-input') as HTMLInputElement
                                    input?.click()
                                }
                            }}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                id="import-file-input"
                                disabled={isUploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    handleFileUpload(file)
                                    e.target.value = ''
                                }}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                                </div>
                            ) : (
                                <>
                                    <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {isDragging ? (
                                            <span className="text-primary font-medium">Suelta el archivo aquí</span>
                                        ) : (
                                            <>Arrastra un archivo o <span className="text-primary underline">haz clic para seleccionar</span></>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                        Solo archivos Excel (.xlsx, .xls)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className={cn(
                            "p-4 border rounded-lg",
                            result.inserted > 0 && !hasErrors ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                                hasErrors ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" :
                                    "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        )}>
                            <div className="flex items-start gap-3">
                                {result.inserted > 0 ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {result.inserted > 0
                                            ? `${result.inserted} de ${result.total} atletas importados`
                                            : "No se importaron atletas"
                                        }
                                    </p>

                                    {hasErrors && (
                                        <div className="mt-2">
                                            <p className="text-xs text-muted-foreground mb-1">Errores encontrados:</p>
                                            <ScrollArea className="max-h-32">
                                                <ul className="text-xs space-y-0.5">
                                                    {allErrors.map((error, idx) => (
                                                        <li key={idx} className="text-destructive">• {error}</li>
                                                    ))}
                                                </ul>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
