'use server';
/**
 * @fileOverview A Genkit flow for extracting a specific person's work schedule from a PDF document.
 * Handles specific shift codes (T=Tarde, M=Mañana) and converts dates to DD-MM-YYYY.
 *
 * - extractPersonScheduleFromPdf - A function that handles the extraction of a person's schedule.
 * - ExtractPersonScheduleFromPdfInput - The input type for the extractPersonScheduleFromPdf function.
 * - ExtractPersonScheduleFromPdfOutput - The return type for the extractPersonScheduleFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractPersonScheduleFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document containing work schedules, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  personName: z.string().describe('The full name of the person whose schedule needs to be extracted.'),
});
export type ExtractPersonScheduleFromPdfInput = z.infer<typeof ExtractPersonScheduleFromPdfInputSchema>;

const ExtractPersonScheduleFromPdfOutputSchema = z.object({
  personName: z.string().describe("The name of the person whose schedule was extracted."),
  reasoning: z.string().describe("A summary of how the data was found and interpreted for debugging purposes."),
  schedule: z.array(
    z.object({
      day: z.string().describe("The full date in DD-MM-YYYY format."),
      hours: z.string().describe("The calculated working hours (e.g., '16:30 - 00:30', 'Off')."),
      rawCellData: z.string().describe("The raw text found in the cell (for debugging)."),
    })
  ).describe("An array of working days and hours for the specified person."),
});
export type ExtractPersonScheduleFromPdfOutput = z.infer<typeof ExtractPersonScheduleFromPdfOutputSchema>;

export async function extractPersonScheduleFromPdf(input: ExtractPersonScheduleFromPdfInput): Promise<ExtractPersonScheduleFromPdfOutput> {
  return extractPersonScheduleFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPersonScheduleFromPdfPrompt',
  input: {schema: ExtractPersonScheduleFromPdfInputSchema},
  output: {schema: ExtractPersonScheduleFromPdfOutputSchema},
  prompt: `You are an expert at parsing work schedules from PDF documents.
Your task is to extract the work schedule for '{{{personName}}}'.

The PDF contains a table where:
1. Column headers contain dates in 'DD-MMM' format in Spanish (e.g., '29-ene', '30-ene', '01-feb').
2. Rows correspond to employees.
3. Cells contain shift codes like 'T1638' or 'M1008'.

Strict Interpretation Rules:
- Date Conversion (Spanish Months): 
  'ene' -> 01 (January)
  'feb' -> 02 (February)
  'mar' -> 03 (March)
  'abr' -> 04 (April)
  'may' -> 05 (May)
  'jun' -> 06 (June)
  'jul' -> 07 (July)
  'ago' -> 08 (August)
  'sep' -> 09 (September)
  'oct' -> 10 (October)
  'nov' -> 11 (November)
  'dic' -> 12 (December)
- Final Date Format: ALWAYS DD-MM-YYYY (use 2026 as the year).
- Shift 'T' (Tarde): Starts with 'T'. Example: 'T1638' means starting at 16:30 with an 8-hour shift. (Output: '16:30 - 00:30').
- Shift 'M' (Mañana): Starts with 'M'. Example: 'M1008' means starting at 10:00 with an 8-hour shift. (Output: '10:00 - 18:00').
- Off Days: If a cell is empty or contains 'L', 'V', or 'VAC', the person is 'Off'.

Debugging Requirements:
- In the 'reasoning' field, explain which row you found for '{{{personName}}}' and how you mapped the columns.
- For each schedule item, include 'rawCellData' showing exactly what was written in the PDF cell.

PDF Content: {{media url=pdfDataUri}}`,
});

const extractPersonScheduleFromPdfFlow = ai.defineFlow(
  {
    name: 'extractPersonScheduleFromPdfFlow',
    inputSchema: ExtractPersonScheduleFromPdfInputSchema,
    outputSchema: ExtractPersonScheduleFromPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
