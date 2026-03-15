'use client';

import { useMemo } from 'react';
import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, ShieldX } from 'lucide-react';

interface RiskDashboardTabProps {
  sites: Site[];
}

export default function RiskDashboardTab({ sites }: RiskDashboardTabProps) {
  const { greenSites, amberSites, redSites } = useMemo(() => {
    const green: string[] = [];
    const amber: string[] = [];
    const red: string[] = [];

    sites.forEach(site => {
      if (site.status === 'N/A') return;

      if (site.status === 'Client happy') {
        green.push(site.name);
      } else if (site.status === 'Operations request' || site.status === 'Under control') {
        amber.push(site.name);
      } else if (site.status === 'Client concerns' || site.status.includes('action')) {
        red.push(site.name);
      }
    });

    return { greenSites: green, amberSites: amber, redSites: red };
  }, [sites]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Green Sites
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{greenSites.length}</div>
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            {greenSites.length > 0 ? greenSites.map(name => <p key={name}>{name}</p>) : <p>No sites with exceptional status.</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monitor Sites
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{amberSites.length}</div>
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            {amberSites.length > 0 ? amberSites.map(name => <p key={name}>{name}</p>) : <p>No sites requiring monitoring.</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Risk Sites
          </CardTitle>
          <ShieldX className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{redSites.length}</div>
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            {redSites.length > 0 ? redSites.map(name => <p key={name}>{name}</p>) : <p>No sites with identified risks.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
