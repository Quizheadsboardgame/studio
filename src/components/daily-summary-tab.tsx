'use client';

import type { Site, Cleaner } from '@/lib/data';

interface DailySummaryTabProps {
  sites: Site[];
  cleaners: Cleaner[];
}

export default function DailySummaryTab({ sites, cleaners }: DailySummaryTabProps) {
  const sitesWithNotes = sites.filter(site => site.notes && site.notes.trim() !== '');
  const cleanersWithNotes = cleaners.filter(cleaner => cleaner.notes && cleaner.notes.trim() !== '');

  const hasContent = sitesWithNotes.length > 0 || cleanersWithNotes.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A summary of all notes recorded for sites and cleaners.
      </p>

      {hasContent ? (
        <div className="rounded-lg border bg-card text-card-foreground p-6">
          <div className="space-y-6">
            {sitesWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Site Notes</h3>
                <div className="space-y-2">
                  {sitesWithNotes.map(site => (
                    <div key={site.id}>
                      <p className="font-medium text-foreground">{site.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{site.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cleanersWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Cleaner Notes</h3>
                <div className="space-y-2">
                  {cleanersWithNotes.map(cleaner => (
                    <div key={cleaner.id}>
                      <p className="font-medium text-foreground">{cleaner.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cleaner.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card text-card-foreground p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No notes found for any sites or cleaners.</p>
        </div>
      )}
    </div>
  );
}
