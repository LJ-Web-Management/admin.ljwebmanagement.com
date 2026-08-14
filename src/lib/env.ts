export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
export const APP_ENV = import.meta.env.VITE_ENV ?? 'mock'

// Until the AWS backend (API Gateway + Lambda + RDS) is deployed and
// VITE_API_BASE_URL points at it, every environment runs against mock
// data so no real customer/order/financial data is ever reachable.
export const USE_MOCK_API = APP_ENV === 'mock' || !API_BASE_URL
