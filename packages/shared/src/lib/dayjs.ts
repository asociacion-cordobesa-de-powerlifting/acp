import baseDayJs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'; // load on demand
import arraySupport from 'dayjs/plugin/arraySupport'
import badMutable from 'dayjs/plugin/badMutable'
import bigIntSupport from 'dayjs/plugin/bigIntSupport'
import calendar from 'dayjs/plugin/calendar'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import devHelper from 'dayjs/plugin/devHelper'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import isMoment from 'dayjs/plugin/isMoment'
import isoWeek from 'dayjs/plugin/isoWeek'
import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import isYesterday from 'dayjs/plugin/isYesterday'
import localeData from 'dayjs/plugin/localeData'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import minMax from 'dayjs/plugin/minMax'
import objectSupport from 'dayjs/plugin/objectSupport'
import pluralGetSet from 'dayjs/plugin/pluralGetSet'
import preParsePostFormat from 'dayjs/plugin/preParsePostFormat'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import toArray from 'dayjs/plugin/toArray'
import toObject from 'dayjs/plugin/toObject'
import updateLocale from 'dayjs/plugin/updateLocale'
import utc from 'dayjs/plugin/utc'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'

baseDayJs.extend(advancedFormat)
baseDayJs.extend(arraySupport)
baseDayJs.extend(badMutable)
baseDayJs.extend(bigIntSupport)
baseDayJs.extend(calendar)
baseDayJs.extend(customParseFormat)
baseDayJs.extend(dayOfYear)
baseDayJs.extend(devHelper)
baseDayJs.extend(duration)
baseDayJs.extend(isBetween)
baseDayJs.extend(isLeapYear)
baseDayJs.extend(isMoment)
baseDayJs.extend(isoWeek)
baseDayJs.extend(isoWeeksInYear)
baseDayJs.extend(isSameOrAfter)
baseDayJs.extend(isSameOrBefore)
baseDayJs.extend(isToday)
baseDayJs.extend(isTomorrow)
baseDayJs.extend(isYesterday)
baseDayJs.extend(localeData)
baseDayJs.extend(localizedFormat)
baseDayJs.extend(minMax)
baseDayJs.extend(objectSupport)
baseDayJs.extend(pluralGetSet)
baseDayJs.extend(preParsePostFormat)
baseDayJs.extend(quarterOfYear)
baseDayJs.extend(relativeTime)
baseDayJs.extend(timezone)
baseDayJs.extend(toArray)
baseDayJs.extend(toObject)
baseDayJs.extend(updateLocale)
baseDayJs.extend(utc)
baseDayJs.extend(weekday)
baseDayJs.extend(weekOfYear)
baseDayJs.extend(weekYear)

export const dayjs = baseDayJs