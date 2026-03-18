/**
 * Application route constants
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  HOME: '/',
  SETTINGS: '/settings',
  SUPPORT: '/support',
  PRICING: '/pricing',
  SERVICES: '/services',
  CONTACT: '/contact',
  
  CHART_ANALYZER: '/chart-analyzer',
  ADMIN: '/admin',
  RESET_PASSWORD: '/reset-password',
  WORLD_INTELLIGENCE: '/world-intelligence',
  APPROVAL_RESULT: '/approval-result',
  SUBSCRIPTION_SUCCESS: '/subscription-success',
  SUBSCRIPTION_CANCELED: '/subscription-canceled',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SERVICE_PAGES: {
    AI_EMPLOYEE: '/services/ai-employee',
    AI_EMPLOYEE_APPLY: '/services/ai-employee/apply',
    AI_AGENTS: '/services/ai-agents',
    AI_AGENTS_APPLY: '/services/ai-agents/apply',
    AUTOMATION: '/services/automation',
    AUTOMATION_APPLY: '/services/automation/apply',
    TICKETING: '/services/ticketing',
    TICKETING_APPLY: '/services/ticketing/apply',
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
export type ServiceRouteKey = keyof typeof ROUTES.SERVICE_PAGES;
