output "web_url" {
  description = "URL of the Next.js frontend on Cloud Run"
  value       = google_cloud_run_v2_service.web.uri
}

output "api_url" {
  description = "URL of the Python API on Cloud Run"
  value       = google_cloud_run_v2_service.api.uri
}

output "artifact_registry_url" {
  description = "Artifact Registry URL for pushing images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.main.repository_id}"
}
