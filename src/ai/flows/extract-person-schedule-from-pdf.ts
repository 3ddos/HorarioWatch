'use server';
/**
 * @fileOverview A Genkit flow for extracting a specific person's work schedule from a PDF document.
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
  schedule: z.array(
    z.object({
      day: z.string().describe("The day of the week (e.g., 'Monday', 'Tuesday')."),
      hours: z.string().describe("The working hours for the day (e.g., '9:00 AM - 5:00 PM', 'Off')."),
    })
  ).describe("An array of working days and hours for the specified person. If the person is not found, this array will be empty."),
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
Your task is to extract the work schedule for the person named '{{{personName}}}' from the provided PDF content.

The PDF contains work schedules for multiple people. Locate the section or row corresponding to '{{{personName}}}' and extract their working days and hours.

Output the schedule in a JSON array format, where each object has 'day' and 'hours' fields.
If a person is not found, return an empty schedule array.
If no specific hours are mentioned for a day, state 'Off' or 'Not Scheduled'.

Example output format:
\`\`\`json
{
  "personName": "John Doe",
  "schedule": [
    { "day": "Monday", "hours": "9:00 AM - 5:00 PM" },
    { "day": "Tuesday", "hours": "9:00 AM - 5:00 PM" },
    { "day": "Wednesday", "hours": "Off" },
    { "day": "Thursday", "hours": "10:00 AM - 6:00 PM" },
    { "day": "Friday", "hours": "10:00 AM - 6:00 PM" }
  ]
}
\`\`\`

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
