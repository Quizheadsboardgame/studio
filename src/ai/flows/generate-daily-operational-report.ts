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
        notes: z.string().optional().describe('Additional notes for the site.'),
      })
    )
    .describe('An array of cleaning sites with their current statuses and notes.'),
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

const SiteInfoSchema = z.object({
  name: z.string(),
  notes: z.string().optional(),
});

const generateDailyOperationalReportPrompt = ai.definePrompt({
  name: 'generateDailyOperationalReportPrompt',
  input: {
    schema: z.object({
      goodSites: z
        .array(SiteInfoSchema)
        .describe('List of sites with positive status (e.g., "Client happy").'),
      monitorSites: z
        .array(SiteInfoSchema)
        .describe(
          'List of sites requiring monitoring (e.g., "Operations request", "Under control").'
        ),
      issueSites: z
        .array(SiteInfoSchema)
        .describe(
          'List of sites with issues or requiring action (e.g., "Client concerns", "Site under action plan", "Site requires action plan").'
        ),
    }),
  },
  output: { schema: GenerateDailyOperationalReportOutputSchema },
  prompt: `You are an intelligent assistant for a cleaning operations manager. Your task is to generate a daily summary report based on the categorized lists of sites provided. For each site, include any notes that have been provided. The report should be structured into Green, Amber, and Red categories.

### DAILY CLEANING OPERATIONS REPORT

---

#### Green: Positive Performing Sites
{{#if goodSites.length}}
{{#each goodSites}}
- **{{name}}**{{#if notes}}: {{notes}}{{/if}}
{{/each}}
{{else}}
*No sites are currently identified as performing exceptionally well.*
{{/if}}

---

#### Amber: Sites Requiring Monitoring
{{#if monitorSites.length}}
{{#each monitorSites}}
- **{{name}}**{{#if notes}}: {{notes}}{{/if}}
{{/each}}
{{else}}
*No sites are currently flagged for monitoring.*
{{/if}}

---

#### Red: Sites With Significant Issues
{{#if issueSites.length}}
{{#each issueSites}}
- **{{name}}**{{#if notes}}: {{notes}}{{/if}}
{{/each}}
{{else}}
*No sites are currently reporting significant issues.*
{{/if}}`,
});

const generateDailyOperationalReportFlow = ai.defineFlow(
  {
    name: 'generateDailyOperationalReportFlow',
    inputSchema: GenerateDailyOperationalReportInputSchema,
    outputSchema: GenerateDailyOperationalReportOutputSchema,
  },
  async (input) => {
    const goodSites: z.infer<typeof SiteInfoSchema>[] = [];
    const monitorSites: z.infer<typeof SiteInfoSchema>[] = [];
    const issueSites: z.infer<typeof SiteInfoSchema>[] = [];

    input.sites.forEach((site) => {
        const siteInfo = { name: site.name, notes: site.notes };
      if (site.status === 'Client happy') {
        goodSites.push(siteInfo);
      } else if (
        site.status === 'Operations request' ||
        site.status === 'Under control'
      ) {
        monitorSites.push(siteInfo);
      } else if (
        site.status === 'Client concerns' ||
        site.status === 'Site under action plan' ||
        site.status === 'Site requires action plan'
      ) {
        issueSites.push(siteInfo);
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
