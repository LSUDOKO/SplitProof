# 13 — References

## Hackathon and platform
- Hackathon page: https://youcam-api-skin-ai-ecommerce.devpost.com/
- Round-one gallery (avoid duplicates): https://youcam-api.devpost.com/project-gallery
- Perfect Corp press release (round two, bonus units, round-one stats): https://www.perfectcorp.com/business/news/YouCam-API-Hackthon-eCommerce
- YouCam AI Skin Analysis docs: https://docs.perfectcorp.com/reference/ai_skin_analysis
- YouCam MCP docs (full tool list): https://docs.perfectcorp.com/develop/mcp
- API Playground guide: https://docs.perfectcorp.com/develop/api_playground
- API console: https://yce.perfectcorp.com/api-console/en/
- Perfect Corp, "Build a Skin Analysis App in 15 Minutes: Claude Code, MCP, and the Skin Analysis API" (response contract, common mistakes): https://www.perfectcorp.com/business/blog/ai-skincare/build-skin-analysis-app-mcp
- Unit system OpenAPI (credit + feature-cost endpoints): https://raw.githubusercontent.com/api-evangelist/perfect-corp/refs/heads/main/openapi/perfect-corp-unit_system-openapi.yml
- Round-one winner Aloud (reference integration pattern: register file, PUT presigned, create task, poll via proxy): https://github.com/StephenSook/aloud

## Split-face and within-subject trial design
- Shu X. et al. (2022). *Effectiveness of a Radiofrequency Device for Rejuvenation of Aged Skin at Home: A Randomized Split-Face Clinical Trial.* Dermatology and Therapy. https://consensus.app/papers/details/328bcf3f0dc25c568c357522e1bb537b/
- Ng J.N.C. et al. (2020). *Efficacy of Home-Use LED Device at 637 and 854-nm for Facial Rejuvenation: A Split-Face Pilot Study.* J Cosmetic Dermatology. https://consensus.app/papers/details/e78878b7db1654008fb5b9773a38c41e/
- Queille-Roussel C. et al. (2026). *Rapid and Visible Efficacy of a Dermocosmetic in Acne Patients With Fair Skin Phototypes: Results of a Randomized Split-Face Study.* J Cosmetic Dermatology. https://consensus.app/papers/details/613c9c01db1a5626a79132ca6720178d/
- Avon Products (NCT05160103). *16-Week Randomized Split-Face Efficacy Study of Cosmetic Formulations in Photoaged Pigmented Skin Subjects* (Fitzpatrick IV–VI). https://clinicaltrials.gov/study/NCT05160103
- LED-RL phototherapy protocol — rationale for split-face design (each subject own control). https://cdn.clinicaltrials.gov/large-docs/16/NCT03795116/Prot_SAP_000.pdf
- Modern Aesthetics (2022). *New Product Evaluation Basics in Aesthetic Practices* (N-of-2 split-face vs no-control design). https://modernaesthetics.com/topics/injectables/new-product-evaluation-basics-in-aesthetic-practices/35166/
- Testing Treatments: split-face and spill-over effects. https://www.testingtreatments.org/?p=5221

## Smartphone imaging and measurement noise
- Smeaton A.F. et al. (2020). *Tracking skin colour and wrinkle changes during cosmetic product trials using smartphone images.* Skin Research and Technology. https://doras.dcu.ie/24924/ · arXiv:2008.01483
- Flament F. et al. (2021). *Comparing the self-perceived effects of a facial anti-aging product to those automatically detected from selfie images of Chinese women.* Skin Research and Technology. https://consensus.app/papers/details/ca8c55d4a3e4506495c64e086852538c/
- Hashimoto W. et al. (2024). *A smartphone application for personalized facial aesthetic monitoring* (face alignment indicators). Skin Research and Technology. https://consensus.app/papers/details/d2a916af49ff5f37a47d435abf399d51/
- Caiazza D., Kreutzkamp S. (2026). *Capturing Optimal Mobile 2D Facial Images in Remote Aesthetics Medicine Clinical Trials.* JMIR Formative Research. https://consensus.app/papers/details/9da2ab4679b2588da2778fb05b9db660/
- Miyamoto K. et al. (2021). *Daily Fluctuation of Facial Pore Area, Roughness and Redness among Young Japanese Women.* J Clinical Medicine. https://consensus.app/papers/details/afdc138938675b7c8765e7aff43e47d2/

## Irritation, actives and sensitive skin
- Nanthini N et al. (2026). *Dermatological Adverse Effects Associated with Social Media–Influenced Skincare Practices: A Hospital-Based Cross-Sectional Study* (India). Acta Medica International. https://consensus.app/papers/details/26fc8964bbdd5472b1a2ad9856dae33a/
- Pryor S. et al. (2024). *Stackable Medical-Grade Skincare for the Cosmetic Medicine Patient* (layering actives causes irritation). Aesthetic Surgery Journal Open Forum. https://consensus.app/papers/details/a4ca5251292f5c8081614f02ebcfec93/
- Wollenberg A. et al. (2022). *Sensitive skin: A relevant syndrome, be aware* (cosmetics as main trigger). JEADV. https://consensus.app/papers/details/1a9cb51b0bcc5f5d9d2c959bc8caca5a/

## Consumer self-assessment and labels
- Practical Dermatology (2024). Self-assessed vs provider-determined Fitzpatrick skin type (discrepancies higher in darker skin). https://practicaldermatology.com/news/study-highlights-gaps-fitzpatrick-skin-type-determination/2468709/
- "How Accurate Is AI Skin Analysis?" (consumer self-assessment ~40% accurate). https://www.theacare.de/post/how-accurate-is-ai-skin-analysis-what-skincare-brands-should-know
- Ozdinc Y. (2021). *Meta-cognitive impairment in processing ingredients* (ingredient jargon). Young Consumers. https://consensus.app/papers/details/2068689b3dc55d01b251933de2311386/

## Virtual try-on research (context for rejected ideas)
- FIT: A Large-Scale Dataset for Fit-Aware Virtual Try-On (2026). https://www.alphaxiv.org/abs/2604.08526
- True to Tone? Quantifying Skin Tone Fidelity and Bias in Photographic-to-Virtual Human Pipelines (2026). https://www.alphaxiv.org/abs/2604.02055
- Beyond Global Realism: Dimension-wise Garment Fidelity Assessment for VTON (2026). https://www.alphaxiv.org/abs/2608.29804
- Reverse Logistics Association: virtual fitting rooms reduce "home try-on" bracketing ≥25%. https://rla.org/media/article/view?id=1003

## Note
Research tools used: Consensus (peer-reviewed search), alphaXiv (arXiv search), web search. Elicit was unavailable (plan without API access).
