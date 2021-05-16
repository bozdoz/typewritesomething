interface GTag {
  (...args: any[]): void;
}

type SentrySeverity =
  | 'fatal'
  | 'error'
  | 'warning'
  | 'log'
  | 'info'
  | 'debug'
  | 'critical';

interface Breadcrumb {
  type?: string;
  level?: SentrySeverity;
  // eslint-disable-next-line camelcase
  event_id?: string;
  category?: string;
  message?: string;
  data?: {
    [key: string]: any;
  };
  timestamp?: number;
}

interface Sentry {
  captureException(err: Error): void;
  captureMessage(msg: string, level?: SentrySeverity): void;
  setExtras(extras: Record<string, unknown>): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
}

declare interface Window {
  dataLayer: any[];
  gtag: GTag;
  sentry: Sentry;
  Sentry: any;
}
