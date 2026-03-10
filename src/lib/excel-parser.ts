import * as XLSX from 'xlsx';
import { addHours, addMinutes, format, parse } from 'date-fns';

export interface ScheduleItem {
    day: string;
    start_time: string;
    end_time: string;
    off: boolean;
    rawCellData: string;
}

export interface ExcelParserOutput {
    personName: string;
    reasoning: string;
    schedule: ScheduleItem[];
}

const SPANISH_MONTHS: Record<string, string> = {
    ene: '01',
    feb: '02',
    mar: '03',
    abr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dic: '12',
};

/**
 * Extracts the year from a filename like '26 25ENE-20FEB.xlsx'
 */
function extractYearFromFileName(fileName: string): number {
    const match = fileName.match(/^(\d{2})\s/);
    if (match) {
        return 2000 + parseInt(match[1], 10);
    }
    return new Date().getFullYear();
}

/**
 * Parses a shift code like 'T1638' or 'M1008'
 */
function parseShift(shiftCode: string, dateStr: string): { start: string; end: string; off: boolean } | null {
    const trimmed = shiftCode.trim().toUpperCase();

    if (!trimmed || ['L', 'V', 'VAC'].includes(trimmed)) {
        return { start: dateStr, end: dateStr, off: true };
    }

    // Expected format: [T|M][HH][M][D]
    // e.g., T1638 -> T, 16, 3 (30 mins), 8 (8 hours)
    const match = trimmed.match(/^([TM])(\d{2})(\d)(\d)$/);
    if (!match) {
        return { start: dateStr, end: dateStr, off: true };
    }

    const [_, type, hh, m, d] = match;
    const hour = parseInt(hh, 10);
    const minutes = parseInt(m, 10) * 10;
    const duration = parseInt(d, 10);

    const startDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    const startDateTime = addMinutes(addHours(startDate, hour), minutes);
    const endDateTime = addHours(startDateTime, duration);

    return {
        start: format(startDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end: format(endDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        off: false,
    };
}

export function extractPersonScheduleFromExcel(
    workbook: XLSX.WorkBook,
    personName: string,
    fileName: string
): ExcelParserOutput {
    const year = extractYearFromFileName(fileName);
    const schedule: ScheduleItem[] = [];
    let reasoning = '';

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (data.length === 0) {
        return { personName, reasoning: 'No data found in spreadsheet.', schedule: [] };
    }

    // Find person row and date columns
    let personRowIndex = -1;
    const dateColumns: { index: number; dateStr: string }[] = [];

    // Look for dates in the first few rows (headers)
    const headerRow = data.find(row => row.some(cell => {
        if (typeof cell === 'string' && /\d{1,2}-[a-z]{3}/i.test(cell)) return true;
        if (typeof cell === 'number' && cell > 40000 && cell < 60000) return true; // Likely a serial date
        return false;
    }));

    if (!headerRow) {
        return { personName, reasoning: 'Could not find date headers (neither DD-MMM strings nor serial numbers).', schedule: [] };
    }

    headerRow.forEach((cell, index) => {
        if (typeof cell === 'string') {
            const match = cell.match(/(\d{1,2})-([a-z]{3})/i);
            if (match) {
                const day = match[1].padStart(2, '0');
                const monthShort = match[2].toLowerCase();
                const month = SPANISH_MONTHS[monthShort];
                if (month) {
                    dateColumns.push({
                        index,
                        dateStr: `${year}-${month}-${day}`,
                    });
                }
            }
        } else if (typeof cell === 'number' && cell > 40000 && cell < 60000) {
            // Convert Excel serial date to JS Date
            // Excel's epoch is 1899-12-30
            const jsDate = new Date((cell - 25569) * 86400 * 1000);
            dateColumns.push({
                index,
                dateStr: format(jsDate, 'yyyy-MM-dd'),
            });
        }
    });

    // Find the row for the person
    personRowIndex = data.findIndex(row =>
        row.some(cell =>
            typeof cell === 'string' &&
            cell.toLowerCase().includes(personName.toLowerCase())
        )
    );

    if (personRowIndex === -1) {
        return { personName, reasoning: `Could not find person "${personName}" in the spreadsheet.`, schedule: [] };
    }

    const personRow = data[personRowIndex];
    reasoning = `Found "${personName}" in row ${personRowIndex + 1}. Mapped ${dateColumns.length} dates.`;

    dateColumns.forEach(col => {
        const rawCellData = (personRow[col.index] || '').toString();
        const parsed = parseShift(rawCellData, col.dateStr);

        if (parsed) {
            schedule.push({
                day: col.dateStr,
                start_time: parsed.start,
                end_time: parsed.end,
                off: parsed.off,
                rawCellData,
            });
        }
    });

    return {
        personName,
        reasoning,
        schedule: schedule.sort((a, b) => a.day.localeCompare(b.day)),
    };
}
