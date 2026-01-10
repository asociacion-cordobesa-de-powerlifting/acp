import es from 'dayjs/locale/es'
import { dayjs } from './lib/dayjs';
export { dayjs };

export type Selection<Enum> = {
    label: string,
    value: Enum
    className?: string
}

// comparar objetos de manera profunda
export function isDeepEqualObjs(object1: Object, object2: Object) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = object1[key as keyof Object];
        const val2 = object2[key as keyof Object];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            areObjects && !isDeepEqualObjs(val1, val2) ||
            !areObjects && val1 !== val2
        ) {
            return false;
        }
    }

    return true;
}

//es un objeto?
function isObject(object: Object) {
    return object != null && typeof object === 'object';
}

//mostrar precio en pesos argentinos
export function formatPrice(price: string | number): string {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(numericPrice);
}

export function localeStrToNumber(numberStr: string) {
    return Number(numberStr.replace(/\./g, '').replace(',', '.'))
}

//calcular precio con porcentaje de descuento
export function getDiscountedPrice(price: string | number, discountPercentage: number): number {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    return numericPrice - (numericPrice * (discountPercentage / 100));
}

//capitalizar strings
export const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()

// formatear numeros de telefono
export function formatPhoneNumber(phoneNumberString: string) {
    var cleaned = ('' + phoneNumberString).replace(/\\D/g, '');
    var match = cleaned.match(/^(\\d{3})(\\d{3})(\\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return null;
}

//extraer id de videos/streams de youtube
export const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match?.[2]?.length === 11 ? match[2] : null;
};

//mostrar bien las fechas, en español porsupuesto
export const formatDate = (date?: Date) => {
    const dateInString = dayjs(date).locale(es).format('dddd/D/MMMM/YYYY')
    const splitted = dateInString.split('/')
    return `${capitalize(splitted[0]!)} ${splitted[1]} de ${capitalize(splitted[2]!)} de ${splitted[3]}`
}

export function cleanAndLowercase(name: string): string {
    return name
        .trim()
        .toLowerCase()
        // Reemplazar caracteres con tildes
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        // Reemplazar espacios y caracteres no alfanuméricos (excepto guiones) por guiones
        .replace(/[^a-z0-9]+/g, '-')
        // Eliminar guiones al principio y al final
        .replace(/^-+|-+$/g, '');
}

export function splitName(fullName: string) {
    // Split the full name by spaces
    const parts = fullName.trim().split(' ');

    // If there's only one word, return it as firstName and empty lastName
    if (parts.length === 1) {
        return {
            firstname: parts[0],
            lastname: ''
        };
    }

    // The first element is the first name
    const firstName = parts[0];

    // The rest of the elements form the last name
    const lastName = parts.slice(1).join(' ');

    return {
        firstname: firstName,
        lastname: lastName
    };
}

// dias a milisegundos
export function daysToMilliseconds(days: number) {
    return days * 24 * 60 * 60 * 1000;
}

// generar un id corto aleatorio
export function generateShortId(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function getLabelFromValue<T>(value: T, enumValues: Selection<T>[]): string {
    return enumValues.find(v => v.value === value)?.label ?? value as string;
}

export * from "./logic/powerlifting";
export * from "./utils/divisions";
