'use client';

import { useState, useMemo } from 'react';
import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { siteLocationMap } from '@/lib/site-locations';

interface SiteMapTabProps {
  sites: Site[];
}

export default function SiteMapTab({ sites }: SiteMapTabProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();

  const siteMapImage = useMemo(() => PlaceHolderImages.find(img => img.id === 'site-map'), []);

  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const locationNumber = useMemo(() => {
    if (!selectedSite) return null;
    return siteLocationMap[selectedSite.name] || 'Not specified';
  }, [selectedSite]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Map</CardTitle>
        <CardDescription>Select a site to see its location number on the map.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedSite && (
            <div className="text-center bg-muted p-3 rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Location Number</p>
              <p className="text-2xl font-bold">{locationNumber}</p>
            </div>
          )}
        </div>

        <div className="relative w-full border rounded-lg overflow-hidden aspect-[4/3]">
          {siteMapImage ? (
            <Image
              src={siteMapImage.imageUrl}
              alt="Site Map of Addenbrooke's Hospital"
              fill
              style={{ objectFit: 'contain' }}
              data-ai-hint={siteMapImage.imageHint}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">Site map image not found. Please check placeholder-images.json.</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">This is a placeholder map. To use your own site map, please update the URL in `src/lib/placeholder-images.json` for the item with id `site-map`.</p>
      </CardContent>
    </Card>
  );
}
