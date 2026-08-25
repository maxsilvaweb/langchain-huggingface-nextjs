# Artifact Registry for container images
resource "google_artifact_registry_repository" "main" {
  location      = var.artifact_registry_location
  repository_id = "rag-chat"
  description   = "Container images for RAG chat application"
  format        = "DOCKER"
}
