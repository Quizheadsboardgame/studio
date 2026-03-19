'use client';

import { useState, useMemo } from 'react';
import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SiteMapTabProps {
  sites: Site[];
}

export default function SiteMapTab({ sites }: SiteMapTabProps) {
  const [startSite, setStartSite] = useState<string>('');
  const [endSite, setEndSite] = useState<string>('');

  const directionsUrl = useMemo(() => {
    if (startSite && endSite) {
      const baseUrl = 'https://maps.google.com/maps';
      const startAddress = `${startSite}, Addenbrooke's Hospital, Cambridge, UK`;
      const endAddress = `${endSite}, Addenbrooke's Hospital, Cambridge, UK`;
      return `${baseUrl}?saddr=${encodeURIComponent(startAddress)}&daddr=${encodeURIComponent(endAddress)}&travelmode=walking&output=embed`;
    }
    // Default view centered on the hospital
    return "https://maps.google.com/maps?q=Addenbrooke's%20Hospital&t=&z=15&ie=UTF8&iwloc=&output=embed";
  }, [startSite, endSite]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Directions</CardTitle>
        <CardDescription>Select a start and end site to get walking directions on campus.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="start-site-select">Start Site</Label>
            <Select value={startSite} onValueChange={setStartSite}>
              <SelectTrigger id="start-site-select">
                <SelectValue placeholder="Select starting point" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.name}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="end-site-select">End Site</Label>
            <Select value={endSite} onValueChange={setEndSite}>
              <SelectTrigger id="end-site-select">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.name}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full border rounded-lg overflow-hidden aspect-video">
          <iframe
            key={directionsUrl} // Force iframe to re-render when URL changes
            src={directionsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Directions are approximate. You can pan and zoom the map to explore the area.
        </p>
      </CardContent>
    </Card>
  );
}
