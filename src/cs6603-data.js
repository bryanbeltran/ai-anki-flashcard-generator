import { applyValidation } from "./validator.js";

const SNAPSHOT = "2026-10-08T00:00:00.000Z";

function source(id, title, url, notes) {
  return {
    id,
    title,
    url,
    type: "reference",
    quality: "authoritative",
    retrievedAt: SNAPSHOT,
    snapshotId: `${id}-snapshot`,
    accessStatus: "available",
    notes,
  };
}

const S = {
  course: source(
    "source-cs6603-course",
    "Georgia Tech OMSCS — CS 6603 course overview and goals",
    "https://omscs.gatech.edu/cs-6603-ai-ethics-and-society",
    "Official Georgia Tech course page defining the four modules, course goals, background expectations, and course framing."
  ),
  videos: source(
    "source-cs6603-videos",
    "Georgia Tech OMSCS — CS 6603 course videos",
    "https://omscs.gatech.edu/cs-6603-ai-ethics-and-society-course-videos",
    "Official Georgia Tech lesson index. The deck follows its 22-lesson order from Introduction through AI, Society, and Ethics Wrap-Up."
  ),
  acm: source(
    "source-acm-code",
    "ACM Code of Ethics and Professional Conduct",
    "https://www.acm.org/binaries/content/assets/about/acm-code-of-ethics-booklet.pdf",
    "Professional responsibilities for computing practitioners, including avoiding harm, fairness, privacy, and public good."
  ),
  rmf: source(
    "source-nist-ai-rmf",
    "NIST AI Risk Management Framework 1.0",
    "https://www.nist.gov/itl/ai-risk-management-framework",
    "Risk-management framework organized around Govern, Map, Measure, and Manage."
  ),
  bias: source(
    "source-nist-bias",
    "NIST SP 1270 — Towards a Standard for Identifying and Managing Bias in Artificial Intelligence",
    "https://www.nist.gov/publications/towards-standard-identifying-and-managing-bias-artificial-intelligence",
    "NIST discussion of systemic, computational/statistical, and human-cognitive sources of bias across the AI lifecycle."
  ),
  oecd: source(
    "source-oecd-ai",
    "OECD AI Principles",
    "https://oecd.ai/en/ai-principles",
    "International principles emphasizing inclusive growth, human-centered values, transparency, robustness, security, and accountability."
  ),
  unesco: source(
    "source-unesco-ai",
    "UNESCO Recommendation on the Ethics of Artificial Intelligence",
    "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    "Global policy framework covering proportionality, do no harm, fairness, privacy, human oversight, transparency, and sustainability."
  ),
  ftc: source(
    "source-ftc-big-data",
    "FTC — Big Data: A Tool for Inclusion or Exclusion?",
    "https://web.archive.org/web/20240101000000/https://www.ftc.gov/reports/big-data-tool-inclusion-or-exclusion-understanding-issues-ftc-report",
    "Archived official FTC report on data practices, discrimination risk, accuracy, transparency, and the use of big data in decisions; the live FTC URL has moved over time."
  ),
  gdpr: source(
    "source-gdpr",
    "European Union General Data Protection Regulation",
    "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    "Primary legal text for principles including purpose limitation, data minimization, accuracy, transparency, and data-subject rights."
  ),
  aiBill: source(
    "source-ai-bill-rights",
    "White House — Blueprint for an AI Bill of Rights",
    "https://bidenwhitehouse.archives.gov/ostp/ai-bill-of-rights/",
    "Policy blueprint organized around safe and effective systems, algorithmic discrimination protections, data privacy, notice/explanation, and human alternatives."
  ),
  asa: source(
    "source-asa-p-values",
    "American Statistical Association — Statement on Statistical Significance and P-Values",
    "https://www.amstat.org/asa/files/pdfs/P-ValueStatement.pdf",
    "Guidance on interpreting p-values, uncertainty, practical importance, and the limits of binary significance decisions."
  ),
  causal: source(
    "source-causal-inference",
    "Hernán and Robins — Causal Inference: What If",
    "https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/",
    "Open causal-inference text covering counterfactuals, confounding, intervention, identification, and observational studies."
  ),
  weat: source(
    "source-weat",
    "Caliskan, Bryson, and Narayanan — Semantics derived automatically from language corpora contain human-like biases",
    "https://arxiv.org/abs/1608.07187",
    "Introduces the Word Embedding Association Test and evidence that corpus-derived representations encode social associations."
  ),
  embeddingDebias: source(
    "source-embedding-debias",
    "Bolukbasi et al. — Man is to Computer Programmer as Woman is to Homemaker?",
    "https://arxiv.org/abs/1607.06520",
    "Classic work on detecting and reducing gender associations in word embeddings, including limitations of geometric debiasing."
  ),
  frvt: source(
    "source-nist-frvt",
    "NIST Face Recognition Vendor Test — Demographic Effects",
    "https://www.nist.gov/programs-projects/face-recognition-vendor-test-frvt",
    "NIST evaluation reporting demographic variation in face-recognition error rates and the role of algorithms, data, and application context."
  ),
  eeoc: source(
    "source-eeoc-guidelines",
    "U.S. EEOC — Employment Tests and Selection Procedures",
    "https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures",
    "Legal and statistical guidance for evaluating selection procedures, adverse impact, validation, and job-relatedness."
  ),
  propublica: source(
    "source-propublica-compas",
    "ProPublica — Machine Bias",
    "https://www.propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing",
    "Case study of competing claims about racial disparities in the COMPAS recidivism-risk system and the importance of metric choice."
  ),
  fairnessImpossibility: source(
    "source-fairness-impossibility",
    "Kleinberg, Mullainathan, and Raghavan — Inherent Trade-Offs in the Fair Determination of Risk Scores",
    "https://arxiv.org/abs/1609.05807",
    "Shows conditions under which calibration and error-rate balance cannot all hold simultaneously when base rates differ."
  ),
  fairlearn: source(
    "source-fairlearn",
    "Fairlearn documentation",
    "https://fairlearn.org/",
    "Open-source toolkit and documentation for assessing and mitigating fairness concerns in machine-learning systems."
  ),
  aif360: source(
    "source-aif360",
    "IBM AI Fairness 360 documentation",
    "https://aif360.readthedocs.io/",
    "Toolkit documentation for fairness metrics, explainers, and preprocessing, in-processing, and post-processing algorithms."
  ),
  modelCards: source(
    "source-model-cards",
    "Mitchell et al. — Model Cards for Model Reporting",
    "https://arxiv.org/abs/1810.03993",
    "Proposes structured documentation of intended use, performance across conditions, limitations, and ethical considerations."
  ),
  datasheets: source(
    "source-datasheets",
    "Gebru et al. — Datasheets for Datasets",
    "https://arxiv.org/abs/1803.09010",
    "Proposes documentation of dataset motivation, composition, collection process, recommended uses, and limitations."
  ),
  mlBook: source(
    "source-ml-book",
    "Google — Machine Learning Crash Course",
    "https://developers.google.com/machine-learning/crash-course",
    "Reference for supervised learning, train/validation/test splits, overfitting, classification, thresholds, and evaluation metrics."
  ),
};

function card({ key, type = "basic", front, back, extra, tags, scopeId, objective = "recall", difficulty = "foundational", sourceIds, acceptedAnswers = [] }) {
  const typeRationale = type === "cloze"
    ? "The deletion targets a single course term inside a stable context."
    : type === "type-in"
      ? "The learner must produce a canonical formula or label rather than recognize it."
      : type === "reversed-basic"
        ? "The reverse direction tests production of the concept from its defining property."
        : "The prompt isolates one retrievable concept and the answer supplies its context and assumptions.";
  return {
    id: `card_${key}`,
    stableId: `cs6603-${key}`,
    type,
    front,
    back,
    extra,
    tags,
    scopeId,
    objective,
    difficulty,
    claimIds: [`claim_${key}`],
    sourceIds,
    typeRationale,
    ...(acceptedAnswers.length ? { acceptedAnswers } : {}),
    evidenceStatus: "verified",
    status: "approved",
    locked: false,
    confidence: 0.96,
    createdAt: SNAPSHOT,
    updatedAt: SNAPSHOT,
  };
}

function q(front, back, extra, difficulty = "foundational", options = {}) {
  return { front, back, extra, difficulty, ...options };
}

const lessons = [
  {
    id: "m1-l1-introduction",
    label: "Module 1 · Lesson 1 — Introduction",
    module: "Module 1 — Data, Individuals, and Society",
    tags: ["module-1", "introduction"],
    sourceIds: [S.course.id, S.videos.id, S.acm.id, S.rmf.id],
    cards: [
      q("What is the central problem CS 6603 asks learners to analyze?", "How data, AI, and machine-learning systems affect individuals and society, including fairness, bias, ethics, legality, collection, deployment, and public use.", "Treat the course as a sociotechnical analysis: the model is only one component of a larger system.", "foundational", { objective: "explain" }),
      q("Why can an AI decision system create social harm even when its model is technically accurate?", "Accuracy is only one property. A system can optimize the wrong target, use unfair or nonrepresentative data, distribute errors unevenly, remove due process, or scale a harmful decision.", "Ask who defines success, who bears errors, and what happens after the prediction enters a real institution.", "intermediate", { objective: "explain" }),
      q("The course moves from {{c1::data, individuals, and society}} through big-data statistics and AI/ML techniques to bias mitigation and future opportunities. What does this progression emphasize?", "Responsible AI reasoning should connect social context, data quality, statistical validity, technical models, evaluation, and intervention rather than treating them as separate topics.", "This is the official four-module arc of the course.", "foundational", { type: "cloze", objective: "recall" }),
      q("What makes a claim about an AI system an argument rather than merely an opinion?", "It states a position, identifies relevant evidence and assumptions, addresses plausible counterarguments, and explains trade-offs and implications.", "CS 6603 explicitly allows differing viewpoints while requiring thoughtful, well-supported reasoning.", "foundational", { objective: "explain" }),
      q("What five-part system should you map before judging an AI application?", "The data-generating process, the model or algorithm, the decision or action, the people and institutions affected, and the deployment and feedback environment.", "This map prevents a narrow focus on model internals from hiding organizational or social causes of harm.", "intermediate", { objective: "apply" }),
      q("What is the difference between allocative harm and representational harm?", "Allocative harm withholds or misallocates an opportunity or resource; representational harm devalues, stereotypes, erases, or mischaracterizes people or groups.", "A system can create both: a hiring score can affect access to jobs and encode degrading assumptions about applicants.", "intermediate", { objective: "distinguish" }),
      q("What responsibility does the ACM Code place on computing professionals when a system may cause harm?", "Professionals should contribute to the public good, avoid harm, be fair, respect privacy, evaluate risks, and communicate relevant limitations rather than hiding behind the system's automation.", "Professional responsibility continues through design, deployment, monitoring, and retirement.", "foundational", { objective: "explain" }),
      q("Why does CS 6603 treat deployment as part of the ethical analysis rather than the final technical step?", "Real-world use changes incentives, populations, error costs, power relationships, and feedback. An acceptable prototype can produce unacceptable outcomes in a different institution or context.", "Use a lifecycle view: define, collect, build, validate, deploy, monitor, respond, and retire.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m1-l2-overview",
    label: "Module 1 · Lesson 2 — Overview",
    module: "Module 1 — Data, Individuals, and Society",
    tags: ["module-1", "overview", "sociotechnical-systems"],
    sourceIds: [S.course.id, S.videos.id, S.rmf.id, S.oecd.id],
    cards: [
      q("What are the four primary modules of CS 6603?", "1) Data, Individuals, and Society; 2) The BS of Big Data and Stats 101; 3) AI/ML Techniques; and 4) Bias Mitigation Applications, also framed as applications and future opportunities.", "The lesson order is preserved in the official Georgia Tech course-video index.", "beginner"),
      q("Why is the data-to-model-to-decision chain useful for ethical analysis?", "It separates where a problem may enter: data collection can encode exclusion, modeling can amplify patterns, decision rules can impose unequal costs, and deployment can create feedback.", "Trace the chain in both directions because decisions can later change the data that are collected.", "foundational", { objective: "apply" }),
      q("What is the difference between bias as a statistical property and bias as a social concern?", "Statistical bias is systematic error relative to a target or estimator; social bias concerns unequal, unjust, or harmful treatment, representation, or outcomes. They can overlap but are not interchangeable.", "A statistically unbiased estimator can still optimize an ethically unacceptable target.", "intermediate", { objective: "distinguish" }),
      q("What is a normative question in AI ethics?", "A question about what should be valued, permitted, required, or prohibited, such as whether a use is justifiable or which error trade-off is acceptable.", "Empirical evidence can inform a normative decision, but it does not by itself settle the value judgment.", "foundational", { objective: "distinguish" }),
      q("Which stakeholders belong in an AI impact map?", "Data subjects, direct users, people evaluated or affected, operators and decision makers, developers, deployers, institutions, regulators, auditors, and communities indirectly affected.", "Include people who lack the power to opt out or contest an outcome.", "intermediate", { objective: "apply" }),
      q("What kinds of risk should be considered together in a responsible-AI review?", "Validity and reliability, fairness and discrimination, privacy and security, safety, transparency and contestability, legal compliance, labor and environmental effects, and institutional accountability.", "NIST AI RMF provides a useful risk-management structure, but no framework replaces contextual judgment.", "intermediate", { objective: "recall" }),
      q("Why is there rarely one universal fairness answer for an AI system?", "Fairness depends on the decision, stakeholders, protected interests, base rates, error costs, legal setting, and whether the goal is equal opportunity, equal outcomes, calibrated risk, or another conception.", "Make the fairness construct explicit before selecting a metric.", "advanced", { objective: "explain" }),
      q("What study habit does the course overview encourage when reading an AI case?", "Separate facts from value judgments, identify assumptions and affected parties, test technical claims, compare alternative interventions, and state trade-offs and uncertainty.", "This habit turns a case summary into a defensible critique.", "foundational", { objective: "apply" }),
    ],
  },
  {
    id: "m1-l3-ethics-law",
    label: "Module 1 · Lesson 3 — Ethics vs. Law",
    module: "Module 1 — Data, Individuals, and Society",
    tags: ["module-1", "ethics", "law", "governance"],
    sourceIds: [S.course.id, S.videos.id, S.acm.id, S.gdpr.id, S.aiBill.id],
    cards: [
      q("How do ethics and law differ?", "Law consists of enforceable rules made by authorized institutions; ethics concerns principles and reasons about what ought to be done. Law can express ethical values but is not identical to moral justification.", "A legal permission is not automatically an ethical endorsement, and an ethical concern may precede legislation.", "foundational", { objective: "distinguish" }),
      q("What does it mean to say that legal compliance is a floor rather than a ceiling?", "Compliance establishes minimum obligations; responsible practice may require additional care for dignity, fairness, privacy, safety, or public trust beyond what a rule explicitly demands.", "Use this distinction without claiming that ethics permits ignoring law.", "foundational", { objective: "explain" }),
      q("What is consequentialist reasoning?", "It evaluates an action or policy primarily by its expected consequences, such as benefits, harms, distribution of outcomes, and affected interests.", "A consequentialist analysis still must specify whose consequences count and how uncertainty is handled.", "foundational", { objective: "recall" }),
      q("What is deontological reasoning?", "It evaluates duties, rules, rights, or constraints that should be respected even when violating them might produce attractive aggregate results.", "Consent, non-discrimination, privacy, and due process can function as constraints rather than merely inputs to a utility calculation.", "foundational", { objective: "recall" }),
      q("How can virtue ethics contribute to an AI design decision?", "It asks what a good professional or institution would do and which character traits—such as honesty, humility, courage, care, and justice—the practice should cultivate.", "Virtue reasoning is useful for accountability and professional conduct but does not eliminate the need to examine concrete outcomes.", "intermediate", { objective: "explain" }),
      q("What is procedural justice in an automated decision process?", "It concerns the fairness of the process: notice, understandable reasons, consistent treatment, an opportunity to be heard, review by an appropriate decision maker, and a meaningful route to correction or appeal.", "A procedurally fair process can still produce substantively unfair results, so evaluate both.", "intermediate", { objective: "explain" }),
      q("Why can an ethical dilemma not be resolved by simply naming a principle?", "Principles can conflict: privacy may limit fairness auditing, transparency may expose security risks, and equal error rates may conflict with calibration. The analyst must explain scope, priorities, trade-offs, and affected parties.", "A reasoned decision is stronger than a slogan such as “be fair.”", "advanced", { objective: "apply" }),
      q("What is the relationship between professional codes and organizational policy?", "A professional code provides duties and values for practitioners; organizational policy operationalizes responsibilities in a particular setting. Neither removes the professional's duty to recognize and escalate harmful practices.", "Document who has authority, what review exists, and how dissent or whistleblowing is handled.", "intermediate", { objective: "explain" }),
      q("What question should a legal analysis ask before applying a regulation to an AI system?", "What activity, jurisdiction, protected interest, actor, data, decision, and legal test the rule actually covers, including definitions, exceptions, enforcement, and available remedies.", "Avoid treating a broad policy summary as a legal conclusion.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m1-l4-data-collection",
    label: "Module 1 · Lesson 4 — Data Collection",
    module: "Module 1 — Data, Individuals, and Society",
    tags: ["module-1", "data", "privacy", "consent"],
    sourceIds: [S.course.id, S.videos.id, S.ftc.id, S.gdpr.id, S.aiBill.id, S.bias.id],
    cards: [
      q("Why is data collection a normative act rather than a neutral prelude to modeling?", "Collectors choose what to observe, whom to include, how to define variables, what purposes are acceptable, and which behaviors become legible to an institution.", "The absence of a group from a dataset can be a consequence of power, access, or surveillance rather than evidence that the group does not matter.", "intermediate", { objective: "explain" }),
      q("What is the difference between notice and meaningful consent?", "Notice communicates a practice; meaningful consent involves understandable information, voluntariness, a real choice, and an appropriate ability to refuse or withdraw when consent is the basis for collection.", "A long policy accepted under dependency or coercion may provide notice without meaningful choice.", "intermediate", { objective: "distinguish" }),
      q("What is purpose limitation?", "Data should be collected for specified, explicit, legitimate purposes and not later reused in incompatible ways without justification or a new lawful basis.", "Purpose limitation is a governance constraint against function creep.", "foundational", { objective: "recall" }),
      q("The principle of {{c1::data minimization}} asks an organization to collect only data that are adequate, relevant, and necessary for a stated purpose. Why does this matter for AI?", "Less unnecessary data reduces exposure, secondary-use risk, surveillance, storage burden, and the number of irrelevant or sensitive proxies a model can learn.", "More data is not automatically more legitimate or more accurate.", "foundational", { type: "cloze", objective: "explain" }),
      q("What is surveillance asymmetry?", "An institution can observe and classify people who cannot meaningfully observe, understand, or challenge the institution's data practices and inferences.", "Asymmetry raises power, privacy, consent, and due-process concerns even when a person has technically visible behavior.", "intermediate", { objective: "explain" }),
      q("Why are proxy variables ethically important?", "A variable can encode or reconstruct a protected or sensitive attribute even when that attribute is omitted, allowing a system to reproduce unequal treatment while appearing neutral.", "Examples include location, names, education histories, language, and network structure; context determines the risk.", "intermediate", { objective: "apply" }),
      q("How can missing data create unfairness?", "Missingness may be concentrated in certain groups or generated by unequal access, nonresponse, measurement failure, or institutional decisions. Imputation can hide that process and introduce new error.", "Analyze the mechanism of missingness, not just the percentage missing.", "intermediate", { objective: "explain" }),
      q("Why does the label-generation process matter?", "Labels often reflect human judgment, institutional policy, historical inequality, or selective observation rather than an objective ground truth. A model can faithfully learn a harmful label.", "Ask who labeled, under what incentives, with what information, and whose outcomes were never observed.", "advanced", { objective: "apply" }),
      q("How can seemingly anonymous data be re-identifiable?", "Combining quasi-identifiers such as dates, locations, demographics, or behavioral traces with outside data can narrow records to people; rare combinations are especially revealing.", "Anonymization claims should be tested against realistic auxiliary data and adversaries.", "intermediate", { objective: "explain" }),
      q("What should a data-governance record preserve about a dataset?", "Provenance, purpose, collection method, population and exclusions, consent or legal basis, transformations, labels, access controls, retention, known limitations, and accountable owners.", "Datasheets and similar documentation make hidden assumptions inspectable; they do not by themselves guarantee ethical use.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m1-l5-fairness-bias",
    label: "Module 1 · Lesson 5 — Fairness and Bias",
    module: "Module 1 — Data, Individuals, and Society",
    tags: ["module-1", "fairness", "bias", "harm"],
    sourceIds: [S.course.id, S.videos.id, S.bias.id, S.ftc.id, S.acm.id],
    cards: [
      q("What is pre-existing bias?", "Bias already present in social institutions, historical records, categories, incentives, or unequal opportunities before a system is designed.", "A model may reproduce pre-existing bias even when the engineering process is internally consistent.", "foundational", { objective: "recall" }),
      q("What is technical bias?", "Bias introduced or amplified by choices in measurement, sampling, labeling, feature construction, modeling, evaluation, thresholds, or implementation.", "Technical bias is not necessarily caused by a malicious designer; it can arise from a mismatch between abstraction and use.", "foundational", { objective: "recall" }),
      q("What is emergent bias?", "Bias that appears when a system is used in a context, population, task, or interaction different from the conditions assumed during design and testing.", "Distribution shift and institutional feedback are common sources of emergent bias.", "foundational", { objective: "recall" }),
      q("How does measurement bias differ from representation bias?", "Measurement bias makes a variable an inaccurate or differently constructed measure of the intended concept; representation bias makes the data population or coverage unrepresentative of the relevant population.", "A well-sampled dataset can still measure the wrong construct, and a valid measure can still be absent for a group.", "intermediate", { objective: "distinguish" }),
      q("What is aggregation bias?", "Using one model, feature representation, or decision rule across groups whose relationships between inputs and outcomes differ in ways the shared representation cannot capture.", "A single average model can perform acceptably overall while failing systematically for subgroups.", "intermediate", { objective: "explain" }),
      q("How can a benchmark create bias?", "Its task definition, labels, sampling, categories, language, image quality, or evaluation metric can privilege some users and make performance appear better than it is in deployment.", "Benchmark performance is evidence under specified conditions, not a universal property of a system.", "intermediate", { objective: "apply" }),
      q("What is a feedback loop in an algorithmic decision system?", "A decision changes behavior, opportunities, or observations, and those changed data are later used to retrain or justify the same decision, reinforcing an initial pattern.", "Predictive policing is a canonical example: policing creates records that then guide more policing.", "advanced", { objective: "explain" }),
      q("Why is bias not identical to discrimination?", "Bias describes systematic skew or error; discrimination concerns unjust differential treatment or impact in a social and legal context. A biased measurement may not map directly to a prohibited decision, and discrimination can occur without an obvious statistical bias.", "Keep statistical diagnosis and normative/legal judgment distinct but connected.", "advanced", { objective: "distinguish" }),
      q("Why should fairness analysis consider intersectionality?", "People occupy overlapping social positions, and a model can appear fair for each broad group while failing badly for an intersection such as race-by-gender or disability-by-age.", "Always inspect meaningful subgroup slices when data and privacy constraints permit.", "intermediate", { objective: "apply" }),
      q("What makes a fairness claim context-dependent?", "The relevant harm, decision, baseline, protected interest, affected group, time horizon, and remedy determine which evidence and fairness criterion are appropriate.", "Start with the decision and harm, then choose measurements; do not start with a favorite metric.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m2-l6-big-data-overview",
    label: "Module 2 · Lesson 6 — The BS of Big Data: Overview",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "big-data", "statistics"],
    sourceIds: [S.course.id, S.videos.id, S.ftc.id, S.bias.id, S.mlBook.id],
    cards: [
      q("What skepticism is captured by the phrase “The BS of Big Data”?", "Large datasets and sophisticated tools can create an illusion of objectivity while hiding biased collection, invalid proxies, confounding, overfitting, bad labels, and unjustified conclusions.", "Scale can magnify a flawed measurement rather than correct it.", "foundational", { objective: "explain" }),
      q("What do the common dimensions of big data describe?", "Volume is amount, velocity is rate of generation or use, variety is heterogeneity of formats and sources, and veracity concerns reliability, provenance, and uncertainty.", "These dimensions describe engineering conditions; none guarantees fairness or truth.", "beginner"),
      q("Why does more data not automatically eliminate bias?", "More observations can reproduce the same selection process, labels, measurement errors, historical inequities, or feedback loops at greater scale.", "Ask whether additional data improve coverage and construct validity, not only sample size.", "foundational", { objective: "explain" }),
      q("What is overfitting?", "A model learns idiosyncrasies or noise in the training data rather than a pattern that generalizes to new cases.", "Overfit models can look impressive on training data and fail silently in deployment.", "foundational", { objective: "recall" }),
      q("Why is data leakage dangerous?", "Information unavailable at prediction time, or derived from the outcome or future, enters features or preprocessing, producing unrealistically strong evaluation results.", "Leakage is a validity failure before it is a fairness failure, but it can also create group-specific harm in deployment.", "intermediate", { objective: "apply" }),
      q("What is the difference between correlation and causation?", "Correlation is statistical association; causation concerns how an intervention or change in one variable would alter an outcome under a specified causal model.", "An accurate correlation may still be useless or harmful as a basis for intervention.", "foundational", { objective: "distinguish" }),
      q("Why should data analysis distinguish exploratory from confirmatory work?", "Exploration generates hypotheses and can search many patterns; confirmation tests pre-specified claims with appropriate uncertainty accounting. Treating exploration as confirmation inflates confidence.", "Record analysis choices and separate discovery from validation.", "intermediate", { objective: "explain" }),
      q("What does a reproducible data pipeline make visible?", "Inputs, versions, transformations, exclusions, random seeds, code, model settings, evaluation slices, and outputs needed to repeat or audit an analysis.", "Reproducibility supports accountability but cannot make an invalid or unethical design valid.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m2-l7-python-stats-101",
    label: "Module 2 · Lesson 7 — Python and Stats 101",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "python", "statistics", "data-preparation"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.bias.id],
    cards: [
      q("In a supervised-learning table, what are features, labels, and rows?", "Features are input variables, the label is the target outcome or class to predict, and each row represents an example or unit of analysis under the dataset's definition.", "The row definition determines whether observations are independent and what population the model describes.", "beginner"),
      q("Why should a data analyst distinguish categorical, ordinal, count, continuous, and binary variables?", "Their meanings, valid operations, encodings, missing-value behavior, and statistical assumptions differ; treating categories as arbitrary numbers can invent misleading distances.", "Type is about measurement meaning, not only the storage format.", "foundational", { objective: "distinguish" }),
      q("What is the purpose of a train/validation/test split?", "Training fits the model, validation supports model or hyperparameter choices, and the held-out test estimates performance on unseen data after choices are fixed.", "Do not repeatedly tune against the test set and then call it independent evidence.", "foundational", { objective: "explain" }),
      q("Why can a fixed random seed improve an analysis without making it unbiased?", "It makes a stochastic split or procedure reproducible so others can inspect and compare it; it does not correct nonrepresentative sampling or guarantee a good split.", "Reproducibility and validity are separate properties.", "foundational", { objective: "distinguish" }),
      q("What risks arise when missing values are silently dropped?", "Dropping rows can change the target population and disproportionately remove groups; dropping columns can discard signal or create a new proxy for missingness.", "Report how missingness varies by relevant subgroup and what mechanism may have generated it.", "intermediate", { objective: "apply" }),
      q("Why can one-hot encoding be safer than numeric labels for unordered categories?", "It represents category membership without implying that category 3 is more or less than category 1 or that their difference has a meaningful magnitude.", "The best encoding still depends on the model and the construct.", "foundational"),
      q("What does standardization do, and what does it not do?", "It rescales a numeric variable, often by subtracting a mean and dividing by a standard deviation; it does not make the variable normally distributed, causally meaningful, or fair.", "Fit transformations on training data when evaluating generalization.", "foundational", { objective: "distinguish" }),
      q("Why should exploratory plots be paired with an explicit data dictionary?", "A plot can reveal patterns, but without definitions, units, collection rules, and valid ranges the analyst may misread a code, category, or aggregation.", "Visualization is a reasoning aid, not a substitute for provenance.", "beginner", { objective: "apply" }),
      q("What is the difference between descriptive and inferential statistics?", "Descriptive statistics summarize observed data; inferential statistics use a sampling or probabilistic model to reason about a wider population or uncertainty beyond the observed sample.", "Inference inherits the assumptions and sampling process that produced the data.", "foundational", { objective: "distinguish" }),
    ],
  },
  {
    id: "m2-l8-descriptive-statistics",
    label: "Module 2 · Lesson 8 — Descriptive Statistics",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "statistics", "descriptive-statistics"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.ftc.id],
    cards: [
      q("When is the median more informative than the mean?", "When the distribution is skewed or contains influential outliers, because the median is the middle order statistic and is less sensitive to extreme values.", "Neither statistic is automatically the right summary; connect it to the decision and distribution.", "foundational", { objective: "apply" }),
      q("What do variance and standard deviation measure?", "They summarize dispersion around the mean; variance uses squared deviations and standard deviation is its square root in the original units.", "A large spread can reflect real heterogeneity, measurement noise, or a mixture of populations.", "beginner"),
      q("What does the interquartile range measure?", "The distance between the 75th and 25th percentiles, covering the middle half of observations and providing a robust spread summary.", "IQR-based summaries are useful when tails or outliers make variance unstable.", "beginner"),
      q("What does a right-skewed distribution imply about mean and median?", "A long right tail often pulls the mean above the median, but the exact relationship depends on the distribution and should be checked rather than assumed.", "Report shape and tail behavior when a single center would conceal important cases.", "foundational"),
      q("Why should outliers be investigated before deletion?", "They may be errors, rare but valid cases, a subgroup, fraud, or a consequence of a measurement process. Deleting them can change the question and disproportionately remove people.", "Use domain rules, provenance, robust methods, and sensitivity analysis.", "intermediate", { objective: "apply" }),
      q("What does a correlation coefficient summarize?", "The direction and strength of a particular form of association, commonly linear association for Pearson correlation, under the chosen variables and population.", "Correlation is sensitive to outliers and does not establish causation.", "foundational", { objective: "recall" }),
      q("What is the ecological fallacy?", "Inferring individual-level relationships from aggregate-level data, or assuming that a pattern across groups must hold for members within each group.", "Disaggregate when the decision concerns individuals and interpret group summaries at their proper level.", "intermediate", { objective: "distinguish" }),
      q("Why can normalization or a rate denominator change the story?", "Rates compare quantities relative to a population at risk; choosing a denominator, time window, or aggregation level changes what the statistic means and which groups appear large or small.", "Always name the numerator, denominator, unit, and time period.", "intermediate", { objective: "apply" }),
      q("What is Simpson's paradox?", "A relationship seen in several groups can reverse or disappear after the groups are combined because group composition or a confounding variable changes the aggregate weighting.", "Inspect stratified results before trusting a single overall average.", "advanced", { objective: "explain" }),
      q("What is the ethical risk of a dashboard that reports only an overall average?", "It can conceal subgroup harms, unequal coverage, uncertainty, tail outcomes, missingness, and changes in population composition behind a seemingly precise summary.", "Pair aggregate metrics with disaggregated, distributional, and uncertainty views.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m2-l9-sampling-bias",
    label: "Module 2 · Lesson 9 — Inferential Statistics: Sampling Bias",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "sampling", "bias", "external-validity"],
    sourceIds: [S.course.id, S.videos.id, S.bias.id, S.ftc.id, S.mlBook.id],
    cards: [
      q("What is the target population?", "The full population or set of units to which the analysis intends to generalize a claim or decision.", "Define it before looking at the sample; otherwise generalization can silently shrink to whoever was easiest to observe.", "beginner"),
      q("What is the accessible population?", "The portion of the target population that the collection process can actually reach under its channels, eligibility rules, time window, and resources.", "A large sample from an inaccessible subset can still be biased for the target population.", "foundational"),
      q("What is coverage bias?", "Systematic undercoverage or exclusion caused by the sampling frame failing to include parts of the target population.", "Digital traces often underrepresent people with limited access, privacy protections, language support, or trust in the system.", "foundational", { objective: "recall" }),
      q("How does self-selection bias arise?", "Participation depends on a person's willingness, ability, incentives, or experience, so respondents differ systematically from nonrespondents or nonusers.", "Voluntary feedback can overrepresent both highly satisfied and highly dissatisfied users.", "foundational"),
      q("What is nonresponse bias?", "The observed respondents differ from sampled units who do not respond in ways related to variables of interest or the outcome.", "A high response rate does not prove absence of nonresponse bias, and a low rate does not quantify its direction by itself.", "intermediate"),
      q("What is survivorship bias?", "Drawing conclusions from units that remain observable or successful while ignoring units that failed, exited, were excluded, or were never recorded.", "Study the denominator and the missing cases, not only the visible winners.", "foundational"),
      q("What is measurement or response bias in a survey?", "Answers or measurements systematically differ from the intended construct because of wording, social desirability, recall, interviewer effects, instrumentation, or incentives.", "A response can be accurately recorded and still be a biased measure of the underlying concept.", "intermediate"),
      q("When can weighting help correct a sample?", "When selection probabilities or population benchmarks are known well enough to reweight observations toward the target population under defensible assumptions.", "Weighting can increase variance and cannot repair an unmeasured group or a fundamentally invalid measurement.", "advanced", { objective: "apply" }),
      q("What is external validity?", "The credibility of applying a finding beyond the observed sample, setting, treatment, time, or measurement conditions.", "External validity requires reasoning about transport, not merely a large n.", "foundational"),
      q("What should a sampling-bias audit document?", "The target and accessible populations, frame, recruitment, response and exclusion patterns, time window, subgroup coverage, missingness, weighting, and plausible directions of bias.", "Make the path from population to dataset explicit before interpreting model performance.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m2-l10-causation-correlation",
    label: "Module 2 · Lesson 10 — Inferential Statistics: Causation vs. Correlation",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "causality", "correlation", "confounding"],
    sourceIds: [S.course.id, S.videos.id, S.causal.id, S.mlBook.id],
    cards: [
      q("What does correlation establish?", "It describes an association in the observed data under a chosen statistical summary; it does not by itself identify the effect of changing one variable.", "State the population, time order, and measurement before interpreting an association.", "beginner"),
      q("What is a confounder?", "A variable that influences both the exposure or treatment and the outcome, creating or distorting their observed association when not appropriately controlled.", "Control requires a causal argument; adding every available variable is not automatically valid.", "foundational", { objective: "recall" }),
      q("What is reverse causation?", "The apparent cause is partly or wholly an effect of the outcome, or the outcome changes the exposure over time.", "Use temporal ordering and a causal model instead of assuming the direction implied by the data table.", "foundational"),
      q("Why can conditioning on a collider create bias?", "A collider is influenced by two variables; conditioning on it can make otherwise unrelated causes statistically associated by selecting a nonrepresentative path.", "This is why “control for everything” is not a sound causal strategy.", "advanced", { objective: "explain" }),
      q("What is the role of randomization in a controlled experiment?", "Random assignment makes treatment independent of measured and unmeasured pre-treatment factors in expectation, supporting a causal comparison under compliance and other assumptions.", "Randomization does not automatically solve attrition, noncompliance, interference, or unethical treatment assignment.", "intermediate", { objective: "explain" }),
      q("What does a causal DAG provide?", "A diagram of assumed causal relationships that helps identify confounders, mediators, colliders, adjustment sets, and paths that should or should not be conditioned on.", "A DAG is an explicit model of assumptions, not proof that the arrows are true.", "intermediate", { objective: "apply" }),
      q("What is a counterfactual outcome?", "The outcome that the same unit would have experienced under an alternative treatment or exposure, even though only one treatment is observed for that unit.", "Causal effects compare potential outcomes under interventions, not merely similar-looking groups.", "advanced", { objective: "recall" }),
      q("What is Simpson's paradox in a causal setting?", "An aggregate association can reverse after stratifying by a third variable because group composition, treatment assignment, or causal structure differs across strata.", "Always ask whether the aggregation mixes populations with different causal pathways.", "advanced", { objective: "apply" }),
      q("Why is a predictive model not automatically a causal model?", "Prediction can use any stable association that improves forecasts, while causal intervention requires assumptions about how variables change and what would happen under a policy.", "A feature may be predictive but unsafe to manipulate or use for allocation.", "foundational", { objective: "distinguish" }),
      q("What question should precede using an association to justify a policy?", "What intervention is proposed, which mechanism is assumed, what alternatives and confounders exist, whose outcomes change, and what evidence could distinguish the causal explanation from competing explanations.", "Policy is an intervention; prediction alone is not its justification.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m2-l11-confidence",
    label: "Module 2 · Lesson 11 — Inferential Statistics: Confidence",
    module: "Module 2 — The BS of Big Data and Stats 101",
    tags: ["module-2", "statistics", "uncertainty", "confidence"],
    sourceIds: [S.course.id, S.videos.id, S.asa.id, S.causal.id, S.mlBook.id],
    cards: [
      q("What is a point estimate?", "A single statistic computed from a sample that estimates a population quantity, such as a mean, proportion, regression coefficient, or error rate.", "The point does not express sampling uncertainty by itself.", "beginner"),
      q("What is a confidence interval intended to communicate?", "An interval produced by a procedure with a stated long-run coverage property under its assumptions, giving a range of estimates compatible with sampling variability.", "A 95% interval is not literally a 95% probability statement about a fixed parameter in the frequentist interpretation.", "intermediate", { objective: "explain" }),
      q("What is standard error?", "A measure of the sampling variability of an estimator under a model or resampling procedure.", "Standard error is uncertainty about an estimate, not the spread of individual observations.", "foundational"),
      q("How does sample size usually affect a standard error?", "With comparable independent observations and a suitable estimator, more observations usually reduce sampling variability, often at a rate related to 1 over the square root of n.", "More data do not fix systematic bias, dependence, or a poor target measure.", "foundational", { objective: "explain" }),
      q("What does a margin of error represent?", "A chosen uncertainty radius around an estimate under a specified confidence procedure and assumptions.", "Name the confidence level, sampling design, estimator, and population when reporting it.", "beginner"),
      q("What is a p-value?", "Under a specified null model and analysis procedure, the probability of data at least as extreme as the observed data; it is not the probability that the null is true.", "The ASA cautions against treating a threshold crossing as a complete measure of evidence or importance.", "intermediate", { objective: "distinguish" }),
      q("What is statistical power?", "The probability that a chosen test detects an effect of a specified size under a particular alternative, design, noise level, and decision threshold.", "Low power makes a non-significant result weak evidence of no effect; high power does not make an effect important.", "intermediate"),
      q("When is bootstrapping useful?", "When resampling from observed data can approximate the sampling distribution of a statistic and the sample reasonably represents the process of interest.", "Bootstrap intervals inherit the sample's selection and measurement problems.", "intermediate", { objective: "apply" }),
      q("Why do multiple comparisons increase false-positive risk?", "Testing many hypotheses creates more opportunities for at least one extreme result by chance unless the analysis accounts for the search or controls an appropriate error rate.", "Pre-registration, holdout validation, correction, and replication address different parts of the problem.", "advanced", { objective: "explain" }),
      q("Why distinguish statistical significance from practical significance?", "A tiny effect can be statistically detectable with a large sample, while a meaningful effect can be uncertain in a small sample. Decisions require magnitude, uncertainty, costs, and context.", "Do not reduce a policy decision to p < 0.05.", "foundational", { objective: "apply" }),
    ],
  },
  {
    id: "m3-l12-word-embeddings",
    label: "Module 3 · Lesson 12 — Word Embeddings",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "nlp", "word-embeddings", "representation"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.weat.id],
    cards: [
      q("What is the distributional hypothesis?", "Words occurring in similar contexts tend to have related meanings or uses, so context patterns can provide a basis for learning representations.", "It is a useful linguistic hypothesis, not a claim that context fully determines meaning or social value.", "foundational", { objective: "recall" }),
      q("Why are dense word embeddings different from one-hot vectors?", "A one-hot vector marks one vocabulary item with a sparse coordinate; a dense embedding represents each item with a learned low-dimensional vector whose geometry can encode patterns of use.", "Dense geometry is useful but can also carry and amplify corpus associations.", "beginner"),
      q("What does a word-embedding vector represent?", "A learned numerical representation derived from a training objective and corpus context; its dimensions generally do not have simple human-interpretable meanings.", "Interpret similarity behavior empirically rather than assigning a moral or semantic meaning to one coordinate.", "foundational"),
      q("What does cosine similarity compare?", "The angle between two vectors, often used to compare their direction while reducing sensitivity to vector magnitude.", "Similarity is relative to the training corpus, preprocessing, vocabulary, and model; it is not a universal semantic truth.", "foundational"),
      q("How can context-window choices affect an embedding?", "A narrow window may emphasize syntactic or local relations; a wider window may capture broader topical or associative relations. The choice changes what “similar” means.", "Model architecture and training data jointly define the representation.", "intermediate", { objective: "explain" }),
      q("What is the intuition behind analogy arithmetic in embeddings?", "Some semantic or syntactic relations may appear as approximate vector directions, so subtracting one term and adding another can retrieve a nearby term.", "Analogy success is a property of a trained geometry, not proof that a relation is universally valid.", "intermediate"),
      q("Why does corpus provenance matter for an embedding?", "The corpus reflects which people, genres, time periods, languages, and institutions are represented, along with its stereotypes, omissions, licenses, and preprocessing choices.", "A model card should identify intended data and known limitations rather than calling an embedding generic.", "intermediate", { objective: "apply" }),
      q("How can polysemy challenge a single word vector?", "One vector may collapse multiple senses or social contexts of a word, making similarity reflect a mixture of meanings and potentially hiding subgroup-specific behavior.", "Contextual representations can separate senses better but introduce their own training and evaluation risks.", "intermediate"),
      q("Why is an embedding not just a passive dictionary?", "It is an optimized representation shaped by an objective, corpus, sampling, and model architecture, and it can influence downstream classifications, rankings, and recommendations.", "Representational choices become consequential when a downstream system treats them as evidence.", "foundational", { objective: "explain" }),
      q("What is a responsible first question before deploying a pretrained embedding?", "What task, users, languages, populations, and harms is it intended for, and what evidence shows that its behavior is valid and acceptable in that context?", "Reuse is not neutral just because training happened elsewhere.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m3-l13-word-embedding-bias",
    label: "Module 3 · Lesson 13 — Bias in Word Embeddings",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "nlp", "bias", "fairness"],
    sourceIds: [S.course.id, S.videos.id, S.weat.id, S.embeddingDebias.id, S.bias.id],
    cards: [
      q("What does bias in a word embedding mean?", "The representation encodes systematic associations or performance differences that reflect social stereotypes, corpus imbalance, measurement choices, or unequal language use.", "The word “bias” needs a task, comparison, and harm context; not every statistical association is an injustice.", "foundational", { objective: "distinguish" }),
      q("What does the Word Embedding Association Test attempt to measure?", "A difference in association strength between target word sets and attribute word sets, using a test statistic and effect size based on vector similarity.", "WEAT is a diagnostic for a representation under specified word lists; it is not a complete audit of a deployed NLP system.", "intermediate", { objective: "recall" }),
      q("What is representational harm in a language model or embedding?", "A system stereotypes, demeans, erases, or mischaracterizes people or groups in the meanings, associations, or language it produces or ranks.", "Representational harm can matter even when no immediate allocation decision is made.", "foundational"),
      q("How can corpus composition produce gender or racial associations?", "Historical text, occupational segregation, stereotypes, unequal authorship, media framing, and differing quantities or contexts of language can become statistical regularities the model learns.", "The model may encode the world as observed rather than the world users want to reproduce.", "intermediate", { objective: "explain" }),
      q("What is the basic idea of geometric debiasing by projection?", "Identify a direction associated with a protected concept, then remove or reduce components of vectors along that direction while trying to preserve desired relations.", "Projection can reduce one measured association without removing all stereotypes or ensuring fair downstream behavior.", "intermediate", { objective: "recall" }),
      q("Why can debiasing an embedding create a false sense of safety?", "Bias may be encoded in many directions, relational structures, vocabulary gaps, or downstream data; removing a selected axis can hide a diagnostic while preserving harmful behavior.", "Evaluate the actual task and multiple subgroups after any mitigation.", "advanced", { objective: "explain" }),
      q("Why does intersectional evaluation matter for word embeddings?", "Associations involving combined identities may be invisible in separate gender or race tests, while downstream language can be especially harmful for less represented intersections.", "Use meaningful target and attribute sets and report uncertainty and coverage.", "intermediate", { objective: "apply" }),
      q("What is the difference between intrinsic and extrinsic embedding evaluation?", "Intrinsic evaluation tests representation properties such as similarity or analogy; extrinsic evaluation measures performance and harms when the representation is used in a downstream task.", "A better intrinsic score does not necessarily imply a fairer application.", "foundational", { objective: "distinguish" }),
      q("Why can fairness and utility appear to trade off in embedding mitigation?", "Removing associations may reduce information useful for a target task, while preserving associations may retain stereotypes. The trade-off depends on what is considered utility and whose costs are counted.", "Make the task and protected interest explicit instead of treating utility as neutral.", "advanced", { objective: "explain" }),
      q("What should an NLP deployment document about social bias?", "Training sources, languages and populations, evaluation sets, known associations, subgroup performance, intended and excluded uses, mitigation steps, residual risk, and a monitoring and redress plan.", "Documentation should be evidence for a decision, not a substitute for one.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m3-l14-facial-recognition",
    label: "Module 3 · Lesson 14 — Facial Recognition",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "computer-vision", "biometrics", "facial-recognition"],
    sourceIds: [S.course.id, S.videos.id, S.frvt.id, S.aiBill.id, S.unesco.id],
    cards: [
      q("What are the main stages of a face-recognition pipeline?", "Capture, face detection, alignment or normalization, feature extraction or representation, comparison or classification, thresholding, and a decision or human review action.", "A fairness issue can enter at any stage, not only in the final classifier.", "foundational", { objective: "recall" }),
      q("What is the difference between face verification and face identification?", "Verification is a one-to-one question about whether a face matches a claimed identity; identification is a one-to-many search for a likely identity in a gallery.", "One-to-many search usually creates different base rates, error exposure, and due-process concerns.", "foundational", { objective: "distinguish" }),
      q("What is a false positive in face recognition?", "The system reports a match or identity when the person is not the claimed or returned identity.", "In a surveillance or enforcement context, a false positive can trigger investigation or loss of liberty rather than merely a failed login.", "beginner"),
      q("What is a false negative in face recognition?", "The system fails to match a person who should have been matched or fails to recognize a claimed identity.", "The social cost depends on context: access denial, missed assistance, or an escape from an unjust system are different harms.", "beginner"),
      q("How does threshold selection affect face-recognition errors?", "A stricter threshold generally reduces some false matches while increasing missed matches; a looser threshold does the opposite, with effects that can differ by group and context.", "The threshold is a policy choice tied to error costs, not a purely technical setting.", "intermediate", { objective: "explain" }),
      q("What does an ROC curve show in a recognition system?", "The trade-off between true-positive and false-positive rates as the decision threshold varies under a specified task and dataset.", "An aggregate ROC can conceal subgroup-specific curves and different operational prevalence.", "foundational"),
      q("Why does application context matter for biometric data?", "A face is difficult to change, can reveal or be linked to identity and sensitive inferences, and may be captured without meaningful consent or awareness.", "Security, privacy, dignity, and surveillance risks differ sharply between voluntary device unlock and public-space identification.", "intermediate", { objective: "apply" }),
      q("What is open-set versus closed-set recognition?", "Closed-set evaluation assumes the correct identity is in the enrolled gallery; open-set recognition allows the person to be unknown, adding a rejection or non-match decision.", "Closed-set accuracy can overstate performance in a deployment where unknown people are common.", "advanced", { objective: "distinguish" }),
      q("Why can benchmark results fail to predict real-world face-recognition performance?", "Deployment may differ in lighting, pose, camera quality, age, population, compression, motion, gallery size, prevalence, and operator behavior.", "Validate the actual use conditions and report subgroup and environment slices.", "intermediate", { objective: "explain" }),
      q("What does NIST FRVT demographic reporting help an analyst examine?", "Variation in face-recognition error rates across demographic groups and the role of algorithm, data, and application conditions.", "It supplies measurement evidence, not a decision that any particular deployment is lawful or acceptable.", "foundational", { objective: "recall" }),
      q("Why is human review not an automatic fix for a biased face-recognition system?", "Reviewers can overtrust automation, lack time or information, reproduce social bias, or treat an algorithmic match as probable cause; review must have authority, training, evidence, and appeal.", "Human-in-the-loop can distribute accountability without actually improving it.", "advanced", { objective: "explain" }),
      q("What question should an organization ask before deploying face recognition in a public setting?", "Is the purpose necessary and proportionate, is consent or legal authority adequate, are less intrusive alternatives available, are error costs and redress acceptable, and can the organization demonstrate accountability?", "The responsible answer may be to narrow the use, add safeguards, or not deploy.", "advanced", { objective: "apply" })
    ],
  },
  {
    id: "m3-l15-facial-recognition-bias",
    label: "Module 3 · Lesson 15 — Bias in Facial Recognition",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "computer-vision", "bias", "biometrics"],
    sourceIds: [S.course.id, S.videos.id, S.frvt.id, S.bias.id, S.aiBill.id],
    cards: [
      q("What does a demographic differential in face-recognition performance mean?", "Error rates or other performance measures differ across demographic groups under a specified task, dataset, algorithm, threshold, and operating condition.", "The differential is a measurement finding; interpreting its justice and policy significance requires context.", "foundational"),
      q("Why can false-positive disparities be especially harmful in surveillance?", "A false match can place an innocent person into an investigation or enforcement pipeline, and the burden may fall unevenly on groups already subject to greater surveillance.", "Error type, base rate, institutional action, and redress determine the harm.", "intermediate", { objective: "explain" }),
      q("Why should face-recognition audits report subgroup distributions, not only subgroup accuracy?", "A group can have a small sample, different image quality, different gallery prevalence, or different operational conditions that affect both estimates and harm.", "Report denominators, uncertainty, task definition, and image or demographic coverage.", "intermediate", { objective: "apply" }),
      q("How can labels create bias in facial datasets?", "Labels may misclassify identity, gender, race, age, emotion, or other attributes; some labels are subjective or socially constructed, and errors may be concentrated in groups.", "A model cannot be validated against a ground truth that is undefined or inconsistently assigned.", "intermediate", { objective: "explain" }),
      q("What is intersectional error analysis?", "Testing combinations of attributes and conditions—such as skin tone and gender presentation or age and disability—to find failures hidden by single-attribute averages.", "Choose slices that correspond to plausible use and harm, while handling privacy and small-cell uncertainty.", "advanced", { objective: "apply" }),
      q("Why can changing a recognition threshold fail to eliminate bias?", "A single threshold may trade errors unevenly when score distributions differ by group; separate thresholds raise governance and fairness questions and can still leave data or context bias.", "Thresholds redistribute error; they do not repair the representation or the use.", "advanced", { objective: "explain" }),
      q("What is the difference between a dataset problem and a deployment problem?", "A dataset problem concerns coverage, labels, quality, or sampling in the evidence used to build or test the system; a deployment problem concerns purpose, population, environment, operator behavior, and institutional action.", "A strong benchmark cannot authorize a harmful deployment.", "foundational", { objective: "distinguish" }),
      q("Why can a face-recognition accuracy improvement still be ethically unacceptable?", "The improvement may expand surveillance, remove anonymity, increase chilling effects, use nonconsensual data, or improve an application whose purpose and remedies are unjust.", "Technical performance answers “how well under a task,” not “whether the task should exist.”", "intermediate", { objective: "apply" }),
      q("What should a biometric impact assessment include?", "Purpose and necessity, affected communities, legal authority, data provenance and retention, subgroup performance, error pathways, security, human review, alternatives, notice, access, appeal, and sunset criteria.", "Make a stop decision possible before deployment.", "advanced", { objective: "apply" }),
      q("Why is “the algorithm is unbiased” an incomplete claim?", "Bias can arise from data, labels, thresholds, interfaces, operators, organizational incentives, and social context even if a narrow test shows balanced model errors.", "Audit the complete sociotechnical system and the consequences of action.", "foundational", { objective: "explain" }),
    ],
  },
  {
    id: "m3-l16-predictive-algorithms-1",
    label: "Module 3 · Lesson 16 — Predictive Algorithms, Part 1",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "machine-learning", "prediction", "modeling"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.bias.id, S.modelCards.id],
    cards: [
      q("What is supervised learning?", "Learning a function from examples paired with target labels or outcomes so the system can predict labels or values for new examples.", "The labels and examples reflect a data-generating process; supervision does not guarantee that the target is desirable.", "beginner"),
      q("What is the difference between a feature and a label?", "A feature is an input supplied to the model; a label is the target the model is trained to predict or estimate.", "A feature can be a proxy for a protected attribute even when that attribute is excluded.", "beginner"),
      q("How do classification and regression differ?", "Classification predicts a category or class; regression predicts a numeric quantity, though both can produce uncertain estimates used in later decisions.", "The choice affects loss functions, evaluation metrics, and what errors mean.", "beginner"),
      q("What is the purpose of a validation set?", "It supports model selection, hyperparameter tuning, threshold choice, or feature decisions without spending the final test set.", "If the validation set is repeatedly optimized until it becomes a target, its evidence becomes optimistic.", "foundational"),
      q("What is regularization?", "A modeling strategy that penalizes complexity or constrains parameters to reduce variance and improve generalization under assumptions about the task.", "Regularization can change subgroup performance; inspect fairness rather than assuming generalization is uniform.", "intermediate", { objective: "recall" }),
      q("Why is overfitting a social-risk issue as well as a technical issue?", "A model that fails on underrepresented or shifted cases can allocate opportunities or impose scrutiny unevenly, and aggregate test performance can hide those failures.", "Generalization must be evaluated on meaningful slices and deployment conditions.", "intermediate", { objective: "explain" }),
      q("What is target leakage in a predictive model?", "A feature contains information about the outcome that would not be available at the time of the decision or is produced by the outcome itself.", "Leakage can create a persuasive but unusable model and can interact with group-specific timing or access.", "intermediate"),
      q("Why is a proxy variable important even when protected attributes are removed?", "It can carry information about group membership and reproduce differential treatment while making the audit less transparent.", "Feature removal is not the same as fairness; compare behavior and causal pathways.", "foundational", { objective: "explain" }),
      q("What is distribution shift?", "A change between training, validation, or deployment distributions, including changes in populations, environments, behavior, measurement, or label relationships.", "Shift can alter both accuracy and fairness after launch.", "foundational"),
      q("What should a model card state about a predictive model?", "Intended use, out-of-scope use, training context, evaluation data, performance by relevant groups and conditions, limitations, ethical considerations, and maintenance or monitoring needs.", "Model cards make claims conditional and inspectable.", "intermediate", { objective: "apply", sourceIds: [S.modelCards.id] }),
    ],
  },
  {
    id: "m3-l17-predictive-algorithms-2",
    label: "Module 3 · Lesson 17 — Predictive Algorithms, Part 2",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "machine-learning", "metrics", "classification"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.eeoc.id],
    cards: [
      q("What is a confusion matrix?", "A table of true positives, false positives, true negatives, and false negatives for a classifier under a specified threshold and population.", "Every rate and fairness claim should identify the underlying counts and decision context.", "beginner"),
      q("What is accuracy?", "The fraction of predictions that are correct: (true positives + true negatives) divided by all evaluated cases.", "Accuracy can be misleading with class imbalance or unequal error costs.", "beginner", { objective: "recall" }),
      q("What is precision?", "Among cases predicted positive, the fraction that are actually positive: true positives divided by predicted positives.", "Precision depends on prevalence and the decision threshold.", "beginner", { objective: "recall" }),
      q("Type the usual formula for precision.", "TP / (TP + FP)", "The denominator is all predicted-positive cases.", "foundational", { type: "type-in", objective: "recall", acceptedAnswers: ["TP/(TP+FP)", "TP / (TP + FP)", "true positives / (true positives + false positives)"] }),
      q("What is recall or true-positive rate?", "Among actual positive cases, the fraction correctly identified: true positives divided by actual positives.", "Recall is useful when missing a positive case is costly, but the appropriate cost is contextual.", "beginner", { objective: "recall" }),
      q("What is false-positive rate?", "Among actual negative cases, the fraction incorrectly predicted positive: false positives divided by actual negatives.", "In a screening or enforcement system, false positives can create investigation or denial costs.", "foundational"),
      q("What is false-negative rate?", "Among actual positive cases, the fraction incorrectly predicted negative: false negatives divided by actual positives.", "False-negative and false-positive costs should be elicited from affected stakeholders rather than assumed symmetric.", "foundational"),
      q("How does a classification threshold affect metrics?", "Changing the threshold changes which scores become positive, usually trading true positives against false positives and changing precision, recall, and error rates.", "Threshold selection is an allocative policy decision when predictions trigger actions.", "intermediate", { objective: "explain" }),
      q("Why is accuracy especially weak for an imbalanced class?", "A model can obtain high accuracy by predicting the majority class while missing nearly every minority or rare positive case.", "Report class-specific counts, rates, and the cost of errors.", "foundational"),
      q("What is calibration?", "A score is calibrated when among cases receiving a given predicted risk, the observed outcome frequency is approximately that risk under the relevant population and time horizon.", "Calibration is a property of probabilities or scores, not a guarantee that ranking or decisions are fair.", "advanced", { objective: "distinguish" }),
      q("What is the base-rate effect?", "When outcome prevalence differs across groups, the same sensitivity, specificity, or score behavior can produce different predictive values and error patterns.", "Always report prevalence and the decision population when comparing metrics.", "intermediate", { objective: "explain" }),
      q("What does a precision-recall curve emphasize?", "Performance trade-offs across thresholds when positive cases are relatively rare or when retrieval quality is more informative than true-negative behavior.", "Choose a curve that matches the operational question; no plot is universally superior.", "intermediate"),
      q("Why should metric selection be stakeholder-informed?", "Metrics encode which errors, groups, time horizons, and outcomes matter. A mathematically convenient metric can ignore the harms borne by people affected by the decision.", "Write the decision rule and harm model before declaring a metric the objective.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m3-l18-predictive-algorithms-3",
    label: "Module 3 · Lesson 18 — Predictive Algorithms, Part 3",
    module: "Module 3 — AI/ML Techniques",
    tags: ["module-3", "risk-scores", "deployment", "accountability"],
    sourceIds: [S.course.id, S.videos.id, S.mlBook.id, S.propublica.id, S.fairnessImpossibility.id, S.eeoc.id],
    cards: [
      q("What is the difference between a risk score and a decision?", "A risk score estimates an outcome or probability; a decision applies a threshold, policy, human judgment, or resource rule that creates an action and its consequences.", "Audit the decision layer, not just predictive discrimination or model scores.", "foundational", { objective: "distinguish" }),
      q("What did the COMPAS debate illustrate?", "Different analysts can report different fairness conclusions because they examine different groups, outcomes, time horizons, definitions of error, and metrics; predictive-risk systems also operate within institutional decisions.", "Treat case studies as lessons in measurement and governance, not as one-line proof that a system is fair or unfair.", "advanced", { objective: "explain" }),
      q("What is disparate impact?", "A facially neutral practice has a substantially unequal adverse effect on a protected group, subject to the applicable legal test, justification, and alternatives.", "Legal doctrine is jurisdiction- and context-specific; statistical disparity alone is not a complete legal conclusion.", "intermediate", { objective: "recall" }),
      q("What are selective labels?", "Outcomes are observed only for cases selected by a prior decision or intervention, so the training labels do not reveal what would have happened to unselected cases.", "Selective observation is common in lending, policing, medicine, and education.", "advanced", { objective: "explain" }),
      q("How can predictive deployment create a feedback loop?", "Predictions affect who receives attention, treatment, resources, or punishment; those actions change later observations, labels, and population behavior, which can reinforce the model.", "Monitor intervention effects rather than treating later data as independent ground truth.", "intermediate", { objective: "apply" }),
      q("What is automation bias?", "People over-rely on an automated recommendation, treating it as more objective or authoritative than warranted and failing to apply independent judgment.", "A human override that is difficult, penalized, or uninformed is not meaningful oversight.", "foundational"),
      q("Why can a well-calibrated score still produce unequal harm?", "Calibration describes conditional outcome frequencies, but groups can have different base rates, thresholds, error rates, resources, exposure, and consequences after a score is used.", "Calibration is valuable evidence, not a universal fairness certificate.", "advanced", { objective: "explain" }),
      q("What does the fairness impossibility result warn about?", "When base rates differ and prediction is imperfect, calibration or predictive parity and equalized error-rate constraints generally cannot all be satisfied simultaneously except in special cases.", "The result does not say fairness is impossible; it says priorities and trade-offs must be made explicit.", "advanced", { objective: "recall", sourceIds: [S.fairnessImpossibility.id] }),
      q("Why is transparency not the same as accountability?", "A system can disclose model details without assigning responsibility, providing remedy, enabling contestation, or changing harmful behavior; accountability requires governance and consequences.", "Documentation should connect to decision rights, monitoring, and redress.", "intermediate", { objective: "distinguish" }),
      q("What should an algorithmic decision audit trace end to end?", "Purpose, authority, data and labels, model versions, thresholds, human actions, subgroup outcomes, incidents, overrides, complaints, changes, and who had power to intervene.", "The audit trail should support reconstruction after harm, not only a pre-launch report.", "advanced", { objective: "apply" }),
      q("Why can an accuracy improvement be a regression for justice?", "A model can improve average predictive performance while increasing burden, surveillance, denial, or error costs for a group or removing a procedural protection.", "Evaluate value and harm distributions, not only the aggregate score.", "intermediate", { objective: "explain" }),
      q("What legal and institutional question should accompany a predictive score?", "Who is authorized to use it, for what purpose, under what evidentiary standard, with what notice, contestability, retention, and remedy, and who is accountable for errors?", "A prediction is not self-justifying evidence for an institutional action.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m4-l19-fairness-bias",
    label: "Module 4 · Lesson 19 — Fairness and Bias",
    module: "Module 4 — Bias Mitigation Applications",
    tags: ["module-4", "fairness-metrics", "bias-mitigation"],
    sourceIds: [S.course.id, S.videos.id, S.rmf.id, S.fairnessImpossibility.id, S.fairlearn.id],
    cards: [
      q("What must be specified before choosing a fairness metric?", "The decision, target construct, groups, time horizon, harm model, outcome labels, intervention, stakeholders, legal context, and which errors or opportunities should be constrained.", "A metric is meaningful only relative to the decision it evaluates.", "advanced", { objective: "apply" }),
      q("What is demographic parity or statistical parity?", "A predictor satisfies it when the rate of positive decisions is equal across protected groups, often written P(Ŷ=1 | A=a) equal across a.", "Parity may be inappropriate when groups have different legitimate needs, qualification distributions, or error costs.", "intermediate", { objective: "recall" }),
      q("What is equal opportunity?", "True-positive rates are equal across groups: qualified or actual-positive people have equal probability of receiving a positive decision.", "It focuses on one error type and requires a meaningful positive-label definition.", "intermediate", { objective: "recall" }),
      q("What is equalized odds?", "Both true-positive rates and false-positive rates are equal across groups conditional on the actual outcome.", "It constrains both classes of error but can conflict with calibration when base rates differ.", "advanced", { objective: "recall" }),
      q("What is predictive parity?", "Positive predictive values are equal across groups: among people receiving a positive prediction, the outcome frequency is comparable.", "Predictive parity can coexist with unequal error rates when base rates differ.", "advanced", { objective: "recall" }),
      q("What is individual fairness?", "Similar individuals should receive similar treatment under a task-relevant similarity relation or metric.", "The similarity metric is a normative and technical choice; “treat everyone identically” is not the same as individual fairness.", "intermediate", { objective: "distinguish" }),
      q("What is counterfactual fairness?", "A decision is counterfactually fair for an individual if it would remain the same in relevant counterfactual worlds where the protected attribute were changed while other causal factors are held according to the causal model.", "The causal model and permitted pathways determine the result; the criterion is not purely observational.", "advanced", { objective: "recall" }),
      q("Why can fairness metrics be mutually incompatible?", "Different metrics condition on different outcomes or predictions, and unequal base rates plus imperfect prediction constrain which rate equalities can hold simultaneously.", "Select and justify a feasible priority rather than reporting only the metric that looks best.", "advanced", { objective: "explain" }),
      q("Why does fairness through unawareness usually fail?", "Removing a protected attribute does not remove correlated proxies, unequal data processes, or historical structure that a flexible model can use.", "Audit outcomes and pathways, not just feature lists.", "foundational", { objective: "explain" }),
      q("What is the difference between outcome fairness and procedural fairness?", "Outcome fairness evaluates distributions or errors; procedural fairness evaluates the process of notice, reasons, voice, consistency, review, and remedy.", "A fair outcome metric cannot replace a fair process for people contesting a decision.", "intermediate", { objective: "distinguish" }),
      q("Why can intersectional fairness be missed by group averages?", "A system can meet parity for each broad attribute separately while producing large disparities for their intersection or for a small group hidden inside an aggregate.", "Report meaningful slices and quantify uncertainty for small groups.", "advanced", { objective: "apply" }),
      q("What does a defensible fairness decision record?", "The selected construct, rejected alternatives, stakeholder input, data and causal assumptions, trade-offs, thresholds, legal constraints, residual harms, monitoring, and a path to revise the choice.", "Fairness is a governance decision that should be revisitable as context changes.", "advanced", { objective: "apply" }),
    ],
  },
  {
    id: "m4-l20-assessment-tools",
    label: "Module 4 · Lesson 20 — Fairness and Bias Assessment Tools",
    module: "Module 4 — Bias Mitigation Applications",
    tags: ["module-4", "auditing", "assessment", "documentation"],
    sourceIds: [S.course.id, S.videos.id, S.rmf.id, S.fairlearn.id, S.aif360.id, S.modelCards.id, S.datasheets.id],
    cards: [
      q("What are the major phases of a fairness assessment?", "Define purpose and harms; map stakeholders and data; inspect data and labels; evaluate subgroup and intersectional behavior; test interventions; review deployment and governance; monitor and provide redress.", "A one-time metric report is only one phase of an assessment.", "foundational", { objective: "recall" }),
      q("What should a subgroup metric table include?", "Group definitions, sample counts, outcome prevalence, confusion-matrix counts or rates, uncertainty, thresholds, time window, missingness, and operational consequences.", "A percentage without a denominator or task definition is not auditable evidence.", "intermediate", { objective: "apply" }),
      q("What is slice-based evaluation?", "Evaluating performance and harm across selected subpopulations, conditions, intersections, and deployment contexts rather than only one aggregate test set.", "Choose slices from plausible risks and stakeholder knowledge, not only from attributes already convenient to store.", "foundational"),
      q("What does Fairlearn help practitioners do?", "Explore disparities, compute group metrics, visualize trade-offs, and apply mitigation approaches such as reductions or threshold-based methods under stated assumptions.", "A toolkit operationalizes measurements; it does not choose the ethically correct target or guarantee valid labels.", "foundational", { objective: "recall", sourceIds: [S.fairlearn.id] }),
      q("What does AI Fairness 360 provide?", "A collection of fairness metrics, explainers, and mitigation algorithms spanning preprocessing, in-processing, and post-processing workflows.", "Use each metric or algorithm with its documented assumptions and validate on the actual decision context.", "foundational", { objective: "recall", sourceIds: [S.aif360.id] }),
      q("What is the purpose of a model card?", "To report intended use, evaluation conditions, performance and limitations, subgroup behavior, ethical considerations, and cautions so users can make informed deployment decisions.", "Model cards document a model; they do not document every institutional decision built around it.", "foundational", { objective: "explain", sourceIds: [S.modelCards.id] }),
      q("What is the purpose of a dataset datasheet?", "To document why and how a dataset was created, its composition and collection process, recommended and discouraged uses, maintenance, and limitations.", "Dataset documentation can reveal missing populations or labels before model training.", "foundational", { objective: "explain", sourceIds: [S.datasheets.id] }),
      q("What is an algorithmic impact assessment?", "A structured governance process that identifies a system's purpose, affected rights and groups, risks, alternatives, evaluation, oversight, and mitigation before or during deployment.", "It should have decision authority and the ability to stop or restrict a system, not merely produce a checklist.", "intermediate", { objective: "apply", sourceIds: [S.aiBill.id, S.rmf.id] }),
      q("Why include participatory or affected-community review?", "People who experience a system can identify harms, context, workarounds, and unacceptable uses that designers and aggregate data may miss.", "Participation needs resources, influence over decisions, and protection from retaliation or extractive consultation.", "advanced", { objective: "explain" }),
      q("What is fairness monitoring after deployment?", "Repeatedly checking relevant performance, subgroup disparities, data and label drift, complaints, overrides, access, and new harms as population and use change.", "A model can remain unchanged while the system becomes unsafe because its environment changed.", "intermediate", { objective: "apply" }),
      q("Why is documentation not proof that a system is fair?", "Documentation records claims, assumptions, and limitations; fairness requires valid evidence, appropriate governance, and acceptable outcomes in the real context.", "Treat documentation as a control that enables review, not as a certification by itself.", "foundational", { objective: "distinguish" }),
      q("What makes an assessment reproducible?", "Versioned data and code, fixed definitions, documented preprocessing, model and threshold versions, evaluation seeds, subgroup rules, metric formulas, and preserved results.", "Reproducibility allows disagreement to focus on assumptions instead of hidden changes.", "intermediate", { objective: "apply" }),
    ],
  },
  {
    id: "m4-l21-bias-mitigation",
    label: "Module 4 · Lesson 21 — AI/ML Techniques for Bias Mitigation",
    module: "Module 4 — Bias Mitigation Applications",
    tags: ["module-4", "mitigation", "machine-learning", "governance"],
    sourceIds: [S.course.id, S.videos.id, S.fairlearn.id, S.aif360.id, S.rmf.id, S.bias.id],
    cards: [
      q("What is preprocessing mitigation?", "Changing data before model fitting, for example by improving sampling, reweighting, resampling, repairing labels, transforming representations, or removing an invalid feature.", "Preprocessing cannot fix a protected group that the collection process never observed or a target that is ethically wrong.", "foundational"),
      q("What does reweighting do?", "It assigns different training weights to examples so the learning objective gives more or less influence to groups, outcomes, or underrepresented combinations.", "Weights change the estimand and variance; inspect calibration, uncertainty, and deployment effects.", "intermediate", { objective: "recall" }),
      q("What is in-processing mitigation?", "Adding fairness constraints, penalties, or objectives during model training so the learned predictor balances predictive loss with a specified fairness condition.", "The constraint may reduce utility under the chosen metric and can fail if the labels or groups are invalid.", "foundational"),
      q("What is adversarial debiasing?", "Training a predictor while an adversary tries to infer a protected attribute from its representation, encouraging the representation to hide that information under a specified adversary and loss.", "Inability to predict an attribute is not the same as causal fairness or absence of downstream disparity.", "advanced", { objective: "recall" }),
      q("What is post-processing mitigation?", "Changing scores, thresholds, labels, or decision rules after a model is trained to satisfy a chosen group constraint or operating trade-off.", "Post-processing can be useful when retraining is costly, but it may require group membership and can raise policy concerns.", "foundational"),
      q("What is the reject-option or human-review strategy?", "Route uncertain, high-risk, or contested cases to additional evidence, a trained reviewer, or a different process instead of applying an automatic decision.", "Review must be resourced, independent enough, explainable, and empowered to change the result.", "intermediate", { objective: "apply" }),
      q("Why can equalizing a metric reduce another form of fairness?", "Changing thresholds or training objectives redistributes errors, may lower calibration or utility, and can shift burdens to groups or cases not represented by the selected metric.", "Evaluate a mitigation against multiple criteria and the actual harm model.", "advanced", { objective: "explain" }),
      q("How can privacy and fairness goals conflict?", "Fairness measurement may require sensitive-group information, while privacy or data-minimization principles limit collection, retention, linkage, or disclosure of that information.", "Use protected information under appropriate governance for auditing when justified; omission can make disparities invisible.", "advanced", { objective: "explain" }),
      q("What is a causal approach to fairness mitigation?", "Use a causal model to distinguish legitimate pathways from impermissible ones, define counterfactuals, and intervene on data, features, or decisions according to that model.", "Causal fairness depends on contested structural assumptions and should be sensitivity-tested.", "advanced", { objective: "recall" }),
      q("Why is changing a metric not the same as mitigating harm?", "A metric can improve while the institution still denies opportunities, increases surveillance, removes appeal, or shifts errors to people with less power.", "Tie every mitigation to an outcome, process, and accountable decision owner.", "intermediate", { objective: "distinguish" }),
      q("What should a before-and-after mitigation comparison report?", "Predictive performance, selected fairness metrics, subgroup and intersectional counts, uncertainty, calibration, operational cost, privacy effects, human workload, residual harms, and the conditions under which results hold.", "Never report only the metric that improved.", "advanced", { objective: "apply" }),
      q("When is the best bias mitigation to not deploy the model?", "When the purpose is unjustified or unnecessary, harms are severe or irreversible, evidence is inadequate, no acceptable trade-off or remedy exists, or the organization cannot govern the system responsibly.", "Non-deployment is an engineering and governance outcome, not a failure of optimization.", "foundational", { objective: "apply" }),
    ],
  },
  {
    id: "m4-l22-wrap-up",
    label: "Module 4 · Lesson 22 — AI, Society, and Ethics Wrap-Up",
    module: "Module 4 — Bias Mitigation Applications",
    tags: ["module-4", "wrap-up", "responsible-ai", "future"],
    sourceIds: [S.course.id, S.videos.id, S.rmf.id, S.oecd.id, S.unesco.id, S.acm.id, S.aiBill.id],
    cards: [
      q("What is the full responsible-AI lifecycle?", "Frame the purpose and stakeholders; collect and govern data; build and validate; assess harms and alternatives; deploy with authority and oversight; monitor; respond and remediate; update, restrict, or retire.", "The course's modules supply tools for different points in this lifecycle.", "foundational", { objective: "recall" }),
      q("What are the four functions of the NIST AI RMF?", "Govern, Map, Measure, and Manage: establish accountability; understand context and risk; measure performance and harms; and prioritize, respond to, and monitor risk.", "The functions are iterative rather than a one-way checklist.", "foundational", { objective: "recall", sourceIds: [S.rmf.id] }),
      q("What does human-centered AI require beyond putting a person in the loop?", "People need meaningful authority, understandable information, adequate time and training, ability to contest or override, protection from automation bias, and accountability for the final process.", "A human rubber stamp is not meaningful oversight.", "intermediate", { objective: "explain" }),
      q("Why are transparency and explainability limited remedies?", "An explanation can be too technical, arrive too late, expose privacy or security, fail to justify the underlying purpose, or leave a person unable to change the decision.", "Pair explanation with notice, evidence access, contestability, correction, and remedy.", "intermediate", { objective: "distinguish" }),
      q("How do privacy, security, safety, and fairness interact?", "A system can protect one dimension while harming another: collecting group attributes may enable fairness auditing but increase privacy risk; a secure model can still make unsafe or discriminatory decisions.", "Assess the joint system and make trade-offs explicit.", "advanced", { objective: "explain" }),
      q("What is algorithmic redress?", "A meaningful route for a person or community to obtain notice, explanation, correction, human reconsideration, compensation, or other remedy after an automated system causes harm.", "Redress must be accessible and able to change outcomes; a complaint inbox alone may be performative.", "foundational", { objective: "recall" }),
      q("Why does procurement matter for AI ethics?", "Organizations often adopt vendor systems they did not build, so contracts and governance must require documentation, audit access, data rights, security, performance evidence, incident reporting, updates, and termination conditions.", "Responsibility cannot be outsourced merely because the model is supplied by a vendor.", "intermediate", { objective: "apply" }),
      q("What are two distinct ways AI can create benefit?", "It can improve access, safety, scientific discovery, accessibility, or resource allocation when the goal and evidence are sound; it can also help people understand or challenge institutions when designed for agency rather than surveillance.", "Benefits should be evaluated for distribution, not only aggregate efficiency.", "foundational", { objective: "explain" }),
      q("What should a final critique of an AI system include?", "The purpose and affected stakeholders; data and label provenance; technical assumptions and uncertainty; subgroup and intersectional outcomes; ethical and legal duties; alternatives; mitigations; governance; monitoring; and redress.", "A critique should state what evidence would change its conclusion.", "advanced", { objective: "apply" }),
      q("What does it mean to support a viewpoint effectively in CS 6603?", "Ground the claim in evidence, distinguish facts from values, acknowledge uncertainty and counterarguments, discuss trade-offs and affected parties, and explain why the proposed action is proportionate.", "The course permits disagreement but expects disciplined reasoning and respect for other viewpoints.", "foundational", { objective: "apply" }),
      q("Why should responsible-AI decisions be revisitable?", "Data, populations, laws, model behavior, social expectations, and harms change; a decision that was defensible under one context can become unsafe or unjust later.", "Set review triggers, sunset dates, incident thresholds, and owners before deployment.", "intermediate", { objective: "explain" }),
      q("What is the most important synthesis across all four modules?", "Technical methods can measure and mitigate some risks, but responsible AI also requires legitimate purposes, representative evidence, ethical and legal reasoning, institutional accountability, affected-community voice, and a willingness not to deploy.", "This is the course's beginning-to-end habit: connect data, models, people, decisions, and consequences.", "advanced", { objective: "apply" }),
      q("What final question should an AI practitioner ask before shipping a system?", "Can we explain why this system should exist, who benefits and bears risk, what evidence supports its use, how it can fail, who is accountable, and how an affected person can obtain correction or remedy?", "If the answers are unclear, the responsible next step may be more investigation, a narrower use, or non-deployment.", "foundational", { objective: "apply" }),
    ],
  },
];

function buildLessonCards() {
  return lessons.flatMap((lesson) => lesson.cards.map((entry, index) => card({
    key: `${lesson.id}-${index + 1}`,
    ...entry,
    scopeId: lesson.id,
    tags: [...lesson.tags, ...(entry.tags || [])],
    sourceIds: entry.sourceIds || lesson.sourceIds,
  })));
}

export function buildCs6603Deck() {
  const cards = buildLessonCards();
  const typeDistribution = cards.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});
  const scope = lessons.map((lesson) => ({
    id: lesson.id,
    label: lesson.label,
    module: lesson.module,
    required: true,
    priority: "required",
  }));
  const claims = cards.map((item) => ({
    id: item.claimIds[0],
    text: `${item.front} — ${item.back}`,
    sourceIds: item.sourceIds,
    verificationStatus: "verified",
    evidenceExcerpt: item.back,
    evidenceLocation: "Curated from the official CS 6603 lesson sequence and linked authoritative references",
    evidenceStrength: "authoritative-reference",
    checkedAt: SNAPSHOT,
  }));
  const project = {
    id: "practice_cs6603_ai_ethics_and_society",
    title: "CS 6603 — AI, Ethics, and Society (Full Course)",
    createdAt: SNAPSHOT,
    updatedAt: SNAPSHOT,
    status: "Needs review",
    course: {
      institution: "Georgia Institute of Technology",
      program: "Online Master of Science in Computer Science",
      code: "CS 6603",
      title: "AI, Ethics, and Society",
      moduleCount: 4,
      lessonCount: lessons.length,
      sequence: lessons.map((lesson) => ({ id: lesson.id, label: lesson.label, module: lesson.module })),
      officialCoursePage: S.course.url,
      officialLessonIndex: S.videos.url,
    },
    brief: {
      topic: "Georgia Tech CS 6603 — AI, Ethics, and Society",
      outcome: "A learner can explain the full course sequence, evaluate AI/ML systems in social and legal context, reason about data and statistical validity, identify bias, compare fairness definitions, audit predictive applications, choose mitigation strategies, and defend a responsible deployment or non-deployment decision.",
      audience: "Georgia Tech OMSCS learner or practitioner studying AI ethics and algorithmic fairness",
      prerequisites: "Prior programming experience and working knowledge of Python and Jupyter notebooks; the official course page lists no significant additional prerequisites.",
      cardCount: cards.length,
      difficulty: "adaptive",
      allowedTypes: Object.keys(typeDistribution),
      direction: "Prompt-to-explanation, distinction, application, cloze, and type-in recall across the official 22-lesson sequence.",
      sourcePolicy: "trusted-external",
      language: "English",
      deckName: "CS 6603 — AI, Ethics, and Society (Full Course)",
      exportFormat: "apkg",
      includedScope: scope.map((item) => item.label).join(", "),
      excludedScope: "Course-specific graded assignments, private Canvas material, instructor-specific exam questions, and professional legal advice.",
      sources: Object.values(S).map((item) => item.url),
      sensitiveContent: "Examples discuss discrimination, surveillance, criminal justice, and unequal access; study with care and context.",
      confirmed: true,
      assumptions: [
        "The official public course-video index is used as the sequence authority; individual offerings can change readings, activities, and assessments.",
        "Cards are study prompts, not legal advice or a substitute for official course documentation.",
        "Fairness metrics are conditional tools; no single metric is a universal fairness certificate.",
      ],
      updatedAt: SNAPSHOT,
    },
    plan: {
      id: "plan_practice_cs6603_ai_ethics_and_society",
      version: 1,
      createdAt: SNAPSHOT,
      scope: scope.map((item) => ({
        ...item,
        allocatedCards: cards.filter((itemCard) => itemCard.scopeId === item.id).length,
        coverageStatus: "covered",
      })),
      objectives: scope.flatMap((item) => [
        { id: `objective_${item.id}_recall`, scopeId: item.id, type: "recall", statement: `Recall the core terms and claims in ${item.label}.`, priority: "required" },
        { id: `objective_${item.id}_apply`, scopeId: item.id, type: "apply", statement: `Apply the lesson's technical and ethical reasoning to a case.`, priority: "required" },
      ]),
      requestedCardCount: cards.length,
      difficulty: "adaptive",
      typeDistribution,
      sourcePolicy: "trusted-external",
      exclusions: ["Private or graded course material", "Instructor-specific exam answers", "Legal advice"],
      risks: ["Public course materials may change between offerings", "Some ethical and legal questions require context-specific judgment"],
      approvedAt: SNAPSHOT,
    },
    sources: Object.values(S),
    claims,
    cards,
    validations: [],
    runs: [{ id: "run_practice_cs6603_ai_ethics_and_society", kind: "curated-practice", createdAt: SNAPSHOT, status: "succeeded", provider: "curated-source-grounded", completedAt: SNAPSHOT }],
    exports: [],
    metrics: null,
  };
  applyValidation(project, { timestamp: SNAPSHOT });
  return project;
}

export { lessons as CS6603_LESSONS, S as CS6603_SOURCES };
