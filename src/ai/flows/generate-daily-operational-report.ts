'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating a daily operational report.
 *
 * - generateDailyOperationalReport - A wrapper function to call the Genkit flow.
 * - GenerateDailyOperationalReportInput - The input type for the flow, representing categorized site statuses.
 * - GenerateDailyOperationalReportOutput - The output type for the flow, representing the natural language report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SiteStatusSchema = z.enum([
  'N/A',
  'Client happy',
  'Operations request',
  'Client concerns',
  'Under control',
  'Site under action plan',
  'Site requires action plan',
]);

const GenerateDailyOperationalReportInputSchema = z.object({
  sites: z
    .array(
      z.object({
        name: z.string().describe('The name of the cleaning site.'),
        status: SiteStatusSchema.describe(
          'The current operational status of the cleaning site.'
        ),
      })
    )
    .describe('An array of cleaning sites with their current statuses.'),
});
export type GenerateDailyOperationalReportInput = z.infer<
  typeof GenerateDailyOperationalReportInputSchema
>;

const GenerateDailyOperationalReportOutputSchema = z
  .string()
  .describe('A natural language summary report of daily cleaning operations.');
export type GenerateDailyOperationalReportOutput = z.infer<
  typeof GenerateDailyOperationalReportOutputSchema
>;

export async function generateDailyOperationalReport(
  input: GenerateDailyOperationalReportInput
): Promise<GenerateDailyOperationalReportOutput> {
  return generateDailyOperationalReportFlow(input);
}

const generateDailyOperationalReportPrompt = ai.definePrompt({
  name: 'generateDailyOperationalReportPrompt',
  input: {
    schema: z.object({
      goodSites: z
        .array(z.string())
        .describe('List of sites with positive status (e.g., "Client happy").'),
      monitorSites: z
        .array(z.string())
        .describe(
          'List of sites requiring monitoring (e.g., "Operations request", "Under control").'
        ),
      issueSites: z
        .array(z.string())
        .describe(
          'List of sites with issues or requiring action (e.g., "Client concerns", "Site under action plan", "Site requires action plan").'
        ),
    }),
  },
  output: { schema: GenerateDailyOperationalReportOutputSchema },
  prompt: `You are an intelligent assistant for a cleaning operations manager. Your task is to generate a natural language daily summary report based on the provided site categorization.

DAILY CLEANING OPERATIONS REPORT

Overall Operational Health:
- Identify key trends from the categorized lists.
- Highlight the overall sentiment regarding the sites.

Positive Performing Sites:
{{#if goodSites.length}}
  The following sites are performing exceptionally well:
  {{#each goodSites}}
    - {{this}}
  {{/each}}
{{else}}
  No sites are currently identified as performing exceptionally well.
{{/if}}

Sites Requiring Monitoring:
{{#if monitorSites.length}}
  These sites require attention or monitoring:
  {{#each monitorSites}}
    - {{this}}
  {{/each}}
{{else}}
  No sites are currently flagged for monitoring.
{{/if}}

Sites With Significant Issues:
{{#if issueSites.length}}
  The following sites are currently experiencing significant issues or require immediate action:
  {{#each issueSites}}
    - {{this}}
  {{/each}}
{{else}}
  No sites are currently reporting significant issues.
{{/if}}

Provide a concise, professional, and actionable report. Emphasize insights and priorities for the operations manager. If there are no sites in a category, explicitly state that and maintain a positive or neutral tone where appropriate.`,
});

const generateDailyOperationalReportFlow = ai.defineFlow(
  {
    name: 'generateDailyOperationalReportFlow',
    inputSchema: GenerateDailyOperationalReportInputSchema,
    outputSchema: GenerateDailyOperationalReportOutputSchema,
  },
  async (input) => {
    const goodSites: string[] = [];
    const monitorSites: string[] = [];
    const issueSites: string[] = [];

    input.sites.forEach((site) => {
      if (site.status === 'Client happy') {
        goodSites.push(site.name);
      } else if (
        site.status === 'Operations request' ||
        site.status === 'Under control'
      ) {
        monitorSites.push(site.name);
      } else if (
        site.status === 'Client concerns' ||
        site.status.includes('action')
      ) {
        issueSites.push(site.name);
      }
    });

    const { output } = await generateDailyOperationalReportPrompt({
      goodSites,
      monitorSites,
      issueSites,
    });
    return output!;
  }
);
