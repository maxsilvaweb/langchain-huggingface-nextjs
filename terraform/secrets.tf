# ============================================================================
# Secret Manager - stores API keys and sensitive config
# ============================================================================

resource "google_secret_manager_secret" "clerk_publishable_key" {
  secret_id = "clerk-publishable-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "clerk_publishable_key" {
  secret      = google_secret_manager_secret.clerk_publishable_key.id
  secret_data = var.clerk_publishable_key
}

resource "google_secret_manager_secret" "clerk_secret_key" {
  secret_id = "clerk-secret-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "clerk_secret_key" {
  secret      = google_secret_manager_secret.clerk_secret_key.id
  secret_data = var.clerk_secret_key
}

resource "google_secret_manager_secret" "clerk_jwt_issuer" {
  secret_id = "clerk-jwt-issuer"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "clerk_jwt_issuer" {
  secret      = google_secret_manager_secret.clerk_jwt_issuer.id
  secret_data = var.clerk_jwt_issuer_domain
}

resource "google_secret_manager_secret" "huggingface_api_key" {
  secret_id = "huggingface-api-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "huggingface_api_key" {
  secret      = google_secret_manager_secret.huggingface_api_key.id
  secret_data = var.huggingface_api_key
}

resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "openai-api-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  secret_data = var.openai_api_key
}

resource "google_secret_manager_secret" "anthropic_api_key" {
  secret_id = "anthropic-api-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "anthropic_api_key" {
  secret      = google_secret_manager_secret.anthropic_api_key.id
  secret_data = var.anthropic_api_key
}

resource "google_secret_manager_secret" "google_api_key" {
  secret_id = "google-api-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "google_api_key" {
  secret      = google_secret_manager_secret.google_api_key.id
  secret_data = var.google_api_key
}

resource "google_secret_manager_secret" "langsmith_api_key" {
  secret_id = "langsmith-api-key"


  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "langsmith_api_key" {
  secret      = google_secret_manager_secret.langsmith_api_key.id
  secret_data = var.langsmith_api_key
}

# IAM: Allow Cloud Run to access secrets
resource "google_secret_manager_secret_iam_member" "cloudrun_access" {
  for_each = {
    clerk_pub    = google_secret_manager_secret.clerk_publishable_key.name
    clerk_sec    = google_secret_manager_secret.clerk_secret_key.name
    clerk_jwt    = google_secret_manager_secret.clerk_jwt_issuer.name
    hf_key       = google_secret_manager_secret.huggingface_api_key.name
    openai_key   = google_secret_manager_secret.openai_api_key.name
    anthropic    = google_secret_manager_secret.anthropic_api_key.name
    google_key   = google_secret_manager_secret.google_api_key.name
    langsmith    = google_secret_manager_secret.langsmith_api_key.name
  }

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.rag_chat.email}"
}
