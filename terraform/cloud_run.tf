# ============================================================================
# Cloud Run Services
# ============================================================================
# Note: For production, use Secret Manager mounts instead of direct env values.
# The secrets are still created in Secret Manager (see secrets.tf) for
# infrastructure-as-code demonstration, but Cloud Run env vars reference
# the Terraform variables directly for provider compatibility.

# --- Next.js Frontend ---
resource "google_cloud_run_v2_service" "web" {
  name     = "rag-chat-web"
  location = var.region

  template {
    service_account = google_service_account.rag_chat.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.main.repository_id}/web:latest"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NEXT_PUBLIC_CONVEX_URL"
        value = var.convex_url
      }

      env {
        name  = "NEXT_PUBLIC_CONVEX_SITE_URL"
        value = var.convex_site_url
      }

      env {
        name  = "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        value = var.clerk_publishable_key
      }

      env {
        name  = "CLERK_SECRET_KEY"
        value = var.clerk_secret_key
      }

      env {
        name  = "CLERK_JWT_ISSUER_DOMAIN"
        value = var.clerk_jwt_issuer_domain
      }

      env {
        name  = "NEXT_PUBLIC_CLERK_SIGN_IN_URL"
        value = "/sign-in"
      }

      env {
        name  = "NEXT_PUBLIC_CLERK_SIGN_UP_URL"
        value = "/sign-up"
      }

      env {
        name  = "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL"
        value = "/"
      }

      env {
        name  = "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL"
        value = "/"
      }

      env {
        name  = "HUGGINGFACE_API_KEY"
        value = var.huggingface_api_key
      }

      env {
        name  = "OPENAI_API_KEY"
        value = var.openai_api_key
      }

      env {
        name  = "ANTHROPIC_API_KEY"
        value = var.anthropic_api_key
      }

      env {
        name  = "GOOGLE_API_KEY"
        value = var.google_api_key
      }

      env {
        name  = "PYTHON_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  depends_on = [google_cloud_run_v2_service.api]
}

# --- Python FastAPI Backend ---
resource "google_cloud_run_v2_service" "api" {
  name     = "rag-chat-api"
  location = var.region

  template {
    service_account = google_service_account.rag_chat.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.main.repository_id}/api:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 20
        http_get {
          path = "/health"
          port = 8080
        }
      }

      env {
        name  = "NEXT_PUBLIC_CONVEX_URL"
        value = var.convex_url
      }

      env {
        name  = "RAG_EMBEDDING_PROVIDER"
        value = var.rag_embedding_provider
      }

      env {
        name  = "LANGSMITH_TRACING"
        value = "true"
      }

      env {
        name  = "LANGSMITH_ENDPOINT"
        value = "https://api.smith.langchain.com"
      }

      env {
        name  = "LANGSMITH_PROJECT"
        value = "langchain-rag-chat"
      }

      env {
        name  = "HUGGINGFACE_API_KEY"
        value = var.huggingface_api_key
      }

      env {
        name  = "OPENAI_API_KEY"
        value = var.openai_api_key
      }

      env {
        name  = "ANTHROPIC_API_KEY"
        value = var.anthropic_api_key
      }

      env {
        name  = "GOOGLE_API_KEY"
        value = var.google_api_key
      }

      env {
        name  = "LANGSMITH_API_KEY"
        value = var.langsmith_api_key
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }
}

# Allow unauthenticated access to the web service
resource "google_cloud_run_v2_service_iam_member" "web_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow unauthenticated access to the API service
# (Next.js API routes proxy to this; service-to-service auth requires Cloud Run IAM token which adds complexity for a demo)
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
