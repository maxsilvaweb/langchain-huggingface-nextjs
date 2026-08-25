# Service account for Cloud Run services
resource "google_service_account" "rag_chat" {
  account_id   = "rag-chat-sa"
  display_name = "RAG Chat Service Account"
  description  = "Service account for RAG chat Cloud Run services and CI/CD"
}

# IAM roles for the service account
resource "google_project_iam_member" "rag_chat_roles" {
  for_each = toset([
    "roles/run.admin",            # Deploy/update Cloud Run services
    "roles/artifactregistry.writer", # Push images to Artifact Registry
    "roles/secretmanager.secretAccessor", # Read secrets at runtime
    "roles/iam.serviceAccountUser",   # Act as the service account for Cloud Run
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.rag_chat.email}"
}
