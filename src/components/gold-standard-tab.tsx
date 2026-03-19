'use client';

import type { Site, Cleaner } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Star } from 'lucide-react';

interface GoldStandardTabProps {
  sites: Site[];
  cleaners: Cleaner[];
}

export default function GoldStandardTab({ sites, cleaners }: GoldStandardTabProps) {

  const goldStarSites = sites.filter(site => site.status === 'Gold Star Site');
  const goldStarCleaners = cleaners.filter(cleaner => cleaner.rating === 'Gold Star Cleaner');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-6 w-6 text-gold-star" />
            Gold Star Sites
          </CardTitle>
          <CardDescription>Sites with a 100% audit score and no active action plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {goldStarSites.length > 0 ? (
            <ul className="space-y-2">
              {goldStarSites.map(site => (
                <li key={site.id} className="flex items-center text-lg font-medium">
                  <Star className="h-5 w-5 mr-3 text-gold-star fill-gold-star" />
                  {site.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No sites currently meet the Gold Star criteria.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-6 w-6 text-gold-star" />
            Gold Star Cleaners
          </CardTitle>
          <CardDescription>Cleaners who work exclusively at Gold Star sites and have no issues.</CardDescription>
        </CardHeader>
        <CardContent>
          {goldStarCleaners.length > 0 ? (
            <ul className="space-y-2">
              {goldStarCleaners.map(cleaner => (
                <li key={cleaner.id} className="flex items-center text-lg font-medium">
                  <Star className="h-5 w-5 mr-3 text-gold-star fill-gold-star" />
                  {cleaner.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No cleaners currently meet the Gold Star criteria.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
