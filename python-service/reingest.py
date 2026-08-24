"""
Re-ingest all documents using the configured embedding provider.
Run this after switching RAG_EMBEDDING_PROVIDER or starting fresh.

Usage: ./venv/bin/python reingest.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

from convex import ConvexClient
from services import OpenAIEmbedder, RecursiveTextChunker

CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")
if not CONVEX_URL:
    raise ValueError("NEXT_PUBLIC_CONVEX_URL not set")

# Documents to ingest
DOCUMENTS = [
    {
        "source": "clinical_trial_results.txt",
        "text": "Clinical trials for the new cardiovascular drug showed a 23% reduction in adverse events compared to placebo. The Phase 3 study enrolled 2500 patients across 45 sites. Primary endpoints were met with statistical significance. The FDA accepted the NDA filing in Q2 2024.",
    },
    {
        "source": "diabetes_glp1_study.txt",
        "text": "The GLP-1 receptor agonist demonstrated superior glycemic control in Type 2 diabetes patients. HbA1c levels decreased by an average of 1.8% over 52 weeks. Weight loss averaged 12.4 kg compared to 2.3 kg with placebo. The medication is administered via weekly subcutaneous injection.",
    },
    {
        "source": "oncology_pd1_combo.txt",
        "text": "PD-1 inhibitor combination therapy achieved a 45% overall response rate in metastatic melanoma patients. Median progression-free survival was 11.5 months versus 6.9 months with monotherapy. Grade 3-4 adverse events occurred in 28% of patients, primarily immune-related colitis and hepatitis.",
    },
    {
        "source": "sma_gene_therapy.txt",
        "text": "The AAV-based gene therapy for spinal muscular atrophy (SMA) showed durable efficacy at 5-year follow-up. 92% of treated infants achieved independent sitting milestone. No new safety signals emerged. The one-time IV infusion replaces the defective SMN1 gene. Treatment cost is approximately 2.1 million USD per patient.",
    },
    {
        "source": "digital_therapeutics_depression.txt",
        "text": "The FDA-cleared digital therapeutic app for major depressive disorder reduced PHQ-9 scores by 48% after 12 weeks of use. Engagement rates averaged 4.2 sessions per week. The CBT-based intervention can be prescribed alongside antidepressants. Reimbursement is available through major insurers.",
    },
    {
        "source": "alzheimers_biomarker.txt",
        "text": "Blood-based biomarkers for Alzheimers disease detection achieved 94% sensitivity and 89% specificity. Plasma p-tau217 levels correlated strongly with amyloid PET imaging results. Early detection possible up to 20 years before symptom onset. The test requires only a standard blood draw and costs under 500 USD.",
    },
    {
        "source": "ai_trial_recruitment.txt",
        "text": "AI-powered patient matching increased clinical trial enrollment by 34%. Natural language processing screens EHR data to identify eligible candidates. Average time to full enrollment decreased from 18 months to 11 months. Diversity metrics improved with 28% increase in underrepresented populations.",
    },
    {
        "source": "cgm_wearable_study.txt",
        "text": "Continuous glucose monitoring CGM devices achieved MARD of 8.9% versus lab reference. Real-time alerts reduced hypoglycemic events by 42%. Integration with insulin pumps enables automated dosing adjustments. Battery life extended to 14 days with wireless charging capability.",
    },
    {
        "source": "drug_pricing_outcomes.txt",
        "text": "Outcomes-based contracting reduced payer costs by 18% while maintaining patient access. Rebates tied to real-world effectiveness data collected over 24 months. 73% of commercial plans adopted value-based arrangements for specialty drugs. Patient out-of-pocket costs capped at 50 USD per month through manufacturer assistance.",
    },
    {
        "source": "fda_breakthrough_pathway.txt",
        "text": "The FDA Breakthrough Therapy designation accelerated review timeline by 4 years. Rolling submission allowed concurrent review of CMC and clinical modules. Priority Review voucher granted for rare pediatric disease indication. First-cycle approval achieved with no complete response letter. Post-marketing commitments include 5-year registry study.",
    },
    {
        "source": "rwe_ehr_analysis.txt",
        "text": "Real-world evidence from electronic health records confirmed clinical trial efficacy. Mortality reduction of 31% observed in 50000 patient retrospective cohort. Subgroup analysis identified enhanced benefit in patients over 65 years. Data supported label expansion to include heart failure with preserved ejection fraction.",
    },
    {
        "source": "lcl_surgery_overview.txt",
        "text": "Here's an overview of LCL (Lateral Collateral Ligament) surgery:\n\nWhat Is the LCL?\n\nThe lateral collateral ligament is one of the four major ligaments stabilising the knee, running along the outer side of the joint and connecting the thighbone (femur) to the fibula. It helps prevent the knee from bending outward (varus stress).\n\nWhen Surgery Is Needed\n\nLCL injuries are graded I to III based on severity. Grade I and II sprains often heal with conservative treatment (bracing, physical therapy, rest). Surgery is typically considered when the ligament is completely torn (Grade III), the injury involves multiple ligaments, there's associated damage to the posterolateral corner, or chronic instability persists despite rehabilitation.\n\nTypes of Procedures\n\nLCL Repair is used for acute injuries where the ligament tissue is still healthy enough to be reattached to bone using sutures or suture anchors. LCL Reconstruction is used for chronic injuries or when the ligament tissue is too damaged to repair. A graft (often from a hamstring tendon) is used to rebuild the ligament.\n\nWhat the Procedure Generally Involves\nPerformed under general or regional anesthesia. Often combined with arthroscopy to assess and treat other knee structures. Graft or repaired ligament is secured to the femur and fibula using screws, anchors, or tunnels drilled into the bone. Surgery time varies, often 1 to 3 hours depending on complexity.\n\nRecovery\nKnee is usually braced and weight-bearing is restricted initially. Physical therapy starts early to restore range of motion, then progresses to strength and stability work. Full recovery, including return to sports, often takes 6 to 12 months. Combined ligament reconstructions tend to have longer recovery timelines.\n\nRisks\nAs with any ligament surgery: infection, stiffness, graft failure, nerve injury (the peroneal nerve runs near the LCL and is a specific concern), and persistent instability.\n\nThis is general information, not medical advice. Anyone dealing with a suspected LCL injury should get an evaluation from an orthopedic specialist.",
    },
]


def main():
    print("Initializing embedder (OpenAI text-embedding-3-small, 384 dims)...")
    embedder = OpenAIEmbedder()
    chunker = RecursiveTextChunker(chunk_size=500, chunk_overlap=50)

    client = ConvexClient(CONVEX_URL)

    total_chunks = 0
    for doc in DOCUMENTS:
        chunks = chunker.chunk(doc["text"])
        if not chunks:
            continue

        embeddings = embedder.embed_batch(chunks)

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            metadata = {
                "source": doc["source"],
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            client.mutation(
                "documents:storePublic",
                {
                    "text": chunk,
                    "embedding": embedding,
                    "metadata": metadata,
                },
            )
            total_chunks += 1

        print(f"  {doc['source']}: {len(chunks)} chunk(s)")

    print(f"\nDone! Re-ingested {total_chunks} chunks across {len(DOCUMENTS)} documents.")
    print("RAG is now ready with OpenAI embeddings.")


if __name__ == "__main__":
    main()
