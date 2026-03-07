
'use server';
/**
 * @fileOverview A Genkit flow for extracting a specific person's work schedule from a document (PDF or Spreadsheet text).
 * Handles specific shift codes (T=Tarde, M=Mañana) and converts dates to YYYY-MM-DD.
 *
 * - extractPersonSchedule - A function that handles the extraction process.
 * - ExtractPersonScheduleInput - The input type for the function.
 * - ExtractPersonScheduleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractPersonScheduleInputSchema = z.object({
  pdfDataUri: z
    .string()
    .optional()
    .describe(
      "A PDF document as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  textContent: z
    .string()
    .optional()
    .describe("Text content extracted from a spreadsheet (CSV/XLSX) representing the schedule table."),
  personName: z.string().describe('The full name of the person whose schedule needs to be extracted.'),
});
export type ExtractPersonScheduleInput = z.infer<typeof ExtractPersonScheduleInputSchema>;

const ExtractPersonScheduleOutputSchema = z.object({
  personName: z.string().describe("The name of the person whose schedule was extracted."),
  reasoning: z.string().describe("A summary of how the data was found and interpreted for debugging purposes."),
  schedule: z.array(
    z.object({
      day: z.string().describe("The full date in YYYY-MM-DD format."),
      hours: z.string().describe("The calculated working hours (e.g., '16:30 - 00:30', 'Off')."),
      rawCellData: z.string().describe("The raw text found in the cell (for debugging)."),
    })
  ).describe("An array of working days and hours for the specified person."),
});
export type ExtractPersonScheduleOutput = z.infer<typeof ExtractPersonScheduleOutputSchema>;

export async function extractPersonScheduleFromPdf(input: ExtractPersonScheduleInput): Promise<ExtractPersonScheduleOutput> {
  return extractPersonScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPersonSchedulePrompt',
  input: { schema: ExtractPersonScheduleInputSchema },
  output: { schema: ExtractPersonScheduleOutputSchema },
  prompt: `You are an expert at parsing work schedules from documents.
Your task is to extract the work schedule for '{{{personName}}}'.

The document provided contains a table where:
1. Column headers or row data contain dates. 
   - Dates might be in 'DD-MMM' format in Spanish (e.g., '29-ene', '30-ene', '01-feb').
2. Rows or columns correspond to employees.
3. Cells contain shift codes like 'T1638' or 'M1008'.

Strict Interpretation Rules:
- Date Conversion (Spanish Months): 
  'ene' -> 01, 'feb' -> 02, 'mar' -> 03, 'abr' -> 04, 'may' -> 05, 'jun' -> 06,
  'jul' -> 07, 'ago' -> 08, 'sep' -> 09, 'oct' -> 10, 'nov' -> 11, 'dic' -> 12.
- Final Date Format: ALWAYS YYYY-MM-DD. The year comes in the name of the file, for example '26 25ENE-20FEB.xlsx' 26 is the year 2026.
- Shift 'T' (Tarde): Starts with 'T'. 'T1638' = 16:30 start, 8-hour shift (Output: '16:30 - 00:30').
- Shift 'M' (Mañana): Starts with 'M'. 'M1008' = 10:00 start, 8-hour shift (Output: '10:00 - 18:00').
- Off Days: If a cell is empty or contains 'L', 'V', or 'VAC', the person is 'Off'.

Debugging Requirements:
- In the 'reasoning' field, explain which row/column you found for '{{{personName}}}' and how you mapped the dates.
- For each schedule item, include 'rawCellData' showing exactly what was written in the cell.

{{#if pdfDataUri}}
PDF Document: {{media url=pdfDataUri}}
{{/if}}

{{#if textContent}}
Spreadsheet Data (Text):
{{{textContent}}}
{{/if}}`,
});

const extractPersonScheduleFlow = ai.defineFlow(
  {
    name: 'extractPersonScheduleFlow',
    inputSchema: ExtractPersonScheduleInputSchema,
    outputSchema: ExtractPersonScheduleOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
