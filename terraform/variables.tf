variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run services"
  type        = string
  default     = "europe-west1"
}

variable "artifact_registry_location" {
  description = "Location for Artifact Registry"
  type        = string
  default     = "europe-west1"
}

# ============================================================================
# Secrets - stored in Google Secret Manager
# ============================================================================

variable "clerk_publishable_key" {
  description = "Clerk publishable key"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key"
  type        = string
  sensitive   = true
}

variable "clerk_jwt_issuer_domain" {
  description = "Clerk JWT issuer domain"
  type        = string
  sensitive   = true
}

variable "convex_url" {
  description = "Convex deployment URL"
  type        = string
}

variable "convex_site_url" {
  description = "Convex site URL"
  type        = string
  default     = ""
}

variable "huggingface_api_key" {
  description = "HuggingFace API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_api_key" {
  description = "Google API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "langsmith_api_key" {
  description = "LangSmith API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "rag_embedding_provider" {
  description = "Embedding provider: huggingface, openai, or google"
  type        = string
  default     = "huggingface"
}

variable "internal_api_key" {
  description = "Shared secret between Next.js and the Python API (openssl rand -hex 32)"
  type        = string
  sensitive   = true
}
