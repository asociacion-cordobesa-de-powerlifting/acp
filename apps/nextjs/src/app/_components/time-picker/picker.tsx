'use client'
import * as React from "react"
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { es } from 'date-fns/locale';

import { cn } from "@acme/ui"
import { Button } from "@acme/ui/button"
import { Calendar } from "@acme/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@acme/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select"
import { TimePickerDemo } from "./demo"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void,
  label?: string
  disabled?: boolean
}

export function DatePicker({ date, setDate, label, disabled = false }: DatePickerProps) {
  const [month, setMonth] = React.useState<number>(date ? date.getMonth() : new Date().getMonth())
  const [year, setYear] = React.useState<number>(date ? date.getFullYear() : new Date().getFullYear())

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)
  }, [])

  const months = React.useMemo(() => {
    if (year) {
      return eachMonthOfInterval({
        start: startOfYear(new Date(year, 0, 1)),
        end: endOfYear(new Date(year, 0, 1))
      })
    }
    return []
  }, [year])

  React.useEffect(() => {
    if (date) {
      setMonth(date.getMonth())
      setYear(date.getFullYear())
    }
  }, [date])

  const handleYearChange = (selectedYear: string) => {
    const newYear = parseInt(selectedYear, 10)
    setYear(newYear)
    if (date) {
      const newDate = new Date(date)
      newDate.setFullYear(newYear)
      setDate(newDate)
    }
  }

  const handleMonthChange = (selectedMonth: string) => {
    const newMonth = parseInt(selectedMonth, 10)
    setMonth(newMonth)
    if (date) {
      const newDate = new Date(date)
      newDate.setMonth(newMonth)
      setDate(newDate)
    } else {
      setDate(new Date(year, newMonth, 1))
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>{label ?? 'Selecciona una fecha'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex justify-between p-2 space-x-1">
          <Select onValueChange={handleYearChange} value={year.toString()}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={handleMonthChange} value={month.toString()}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {format(m, "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={new Date(year, month)}
          onMonthChange={(newMonth) => {
            setMonth(newMonth.getMonth())
            setYear(newMonth.getFullYear())
          }}
          initialFocus
        />
        {/* <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        /> */}
        <div className="p-3 border-t h-full border-border">
          <TimePickerDemo
            date={date}
            setDate={setDate}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
