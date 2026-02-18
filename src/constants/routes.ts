/**
 * Application route constants
 * Centralized route definitions for type-safe navigation
 */

export const ROUTES = {
  HOME: '/',
  SETTINGS: '/settings',
  SUPPORT: '/support',
  PRICING: '/pricing',
  ENGINEERING: '/engineering',
  
  COMPLIANCE: '/compliance',
  ENGINEERING_GRADING: '/engineering/grading',
  ADMIN: '/admin',
  RESET_PASSWORD: '/reset-password',
  APPROVAL_RESULT: '/approval-result',
  SUBSCRIPTION_SUCCESS: '/subscription-success',
  SUBSCRIPTION_CANCELED: '/subscription-canceled',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SERVICES: {
    AI_EMPLOYEE: '/services/ai-employee',
    AI_EMPLOYEE_APPLY: '/services/ai-employee/apply',
    AI_AGENTS: '/services/ai-agents',
    AI_AGENTS_APPLY: '/services/ai-agents/apply',
    AUTOMATION: '/services/automation',
    AUTOMATION_APPLY: '/services/automation/apply',
    TICKETING: '/services/ticketing',
    TICKETING_APPLY: '/services/ticketing/apply',
    CIVIL_ENGINEERING: '/services/civil-engineering',
    CONTENT_CREATOR: '/services/content-creator-sites',
    CONTENT_CREATOR_APPLY: '/services/content-creator-sites/apply',
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
export type ServiceRouteKey = keyof typeof ROUTES.SERVICES;
