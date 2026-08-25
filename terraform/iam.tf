# Service account for Cloud Run services
resource "google_service_account" "rag_chat" {
  account_id   = "rag-chat-sa"
  display_name = "RAG Chat Service Account"
  description  = "Service account for RAG chat Cloud Run services"
}
