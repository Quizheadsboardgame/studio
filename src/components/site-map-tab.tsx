'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SiteMapTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Map</CardTitle>
        <CardDescription>An interactive map of the Addenbrooke's Hospital campus.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full border rounded-lg overflow-hidden aspect-video">
          <iframe
            src="https://maps.google.com/maps?q=Addenbrooke's%20Hospital&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          You can pan and zoom the map to explore the area.
        </p>
      </CardContent>
    </Card>
  );
}
