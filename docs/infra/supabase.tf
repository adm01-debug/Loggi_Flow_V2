# 🏗️ INFRASTRUCTURE AS CODE — SUPABASE & LOVABLE

resource "supabase_project" "logiflow_prod" {
  name             = "LogiFlow Production"
  region           = "sa-east-1" # São Paulo
  organization_id  = var.supabase_org_id
  plan             = "pro"
}

resource "supabase_database_config" "prod_db" {
  project_id = supabase_project.logiflow_prod.id
  
  # Partitioning and performance settings
  statement_timeout = "60s"
  lock_timeout      = "10s"
}

resource "lovable_project" "logiflow" {
  name        = "LogiFlow"
  project_id  = var.lovable_project_id
  environment = "production"
  
  secrets = {
    BITRIX24_WEBHOOK_URL = var.bitrix_webhook
    LALAMOVE_API_KEY     = var.lalamove_key
    RODONAVES_API_TOKEN  = var.rodonaves_token
    UPSTASH_REDIS_URL    = var.redis_url
    SENTRY_DSN           = var.sentry_dsn
  }
}

# Network Security - CSP Headers
resource "supabase_auth_config" "auth" {
  project_id = supabase_project.logiflow_prod.id
  
  uri_allow_list = ["https://logiflow.app", "http://localhost:3000"]
  mfa_enabled    = true
}
