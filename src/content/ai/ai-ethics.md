AI systems now decide who gets a loan, which résumé is read, what news people see and how patients are triaged. **Responsible AI** is about making those systems fair, transparent, private, safe and accountable — not as an afterthought, but as part of the engineering. Interviews increasingly ask about it, and the ideas are concrete and measurable.

## Where bias comes from

| Source | Example |
|---|---|
| **Historical bias** | past hiring data reflects past discrimination; a model trained on it learns to repeat it |
| **Representation / sampling bias** | face datasets with few darker-skinned faces → higher error rates for those groups |
| **Measurement bias** | using "arrests" as a proxy for "crime" when policing is uneven |
| **Proxy features** | removing *gender* doesn't help if *postcode* or *college* correlates with it |
| **Label bias** | annotators' subjective judgements |
| **Feedback loops** | a model's predictions shape the data it is later retrained on |
| **Deployment mismatch** | a model used on a population it wasn't built for |

## Measuring fairness

For a binary decision (approve / reject) and groups A and B, common **group fairness** criteria:

| Criterion | Requires equal across groups | Intuition |
|---|---|---|
| **Demographic parity** | approval rate $P(\hat{Y} = 1)$ | same share of each group approved |
| **Equal opportunity** | true positive rate $P(\hat{Y} = 1 \mid Y = 1)$ | qualified people have the same chance |
| **Equalized odds** | TPR **and** false positive rate | equal error rates for both outcomes |
| **Predictive parity / calibration** | $P(Y = 1 \mid \hat{Y} = 1)$, or calibrated scores per group | a score means the same thing for everyone |

The lab shows one model with two groups: a single shared threshold gives qualified people in group B a lower approval rate; adjusting group thresholds can equalise TPR (equal opportunity) or approval rates (demographic parity) — but not everything at once.

> [!IMPORTANT] The impossibility results
> When base rates differ between groups and the classifier isn't perfect, calibration and equal false-positive *and* false-negative rates cannot all hold simultaneously (Kleinberg et al.; Chouldechova, 2016–17). Choosing a fairness definition is a value judgement about which errors matter most — make it explicitly, document it, and involve the people affected.

```python
import numpy as np

rng = np.random.default_rng(0)
group = np.array(["A"] * 500 + ["B"] * 500)
y = np.concatenate([rng.random(500) < 0.5, rng.random(500) < 0.3]).astype(int)
# B's scores are shifted down (e.g. a biased proxy feature)
score = np.clip(np.where(y == 1, 0.65, 0.38) - np.where(group == "B", 0.07, 0)
                + rng.normal(0, 0.12, 1000), 0, 1)

def report(thresholds):
    for g in ("A", "B"):
        m = group == g
        pred = score[m] >= thresholds[g]
        print(f"  {g}: approval {pred.mean():.2f}  TPR {pred[y[m] == 1].mean():.2f}  "
              f"FPR {pred[y[m] == 0].mean():.2f}")

print("shared threshold 0.5:")
report({"A": 0.5, "B": 0.5})
print("group thresholds chosen for equal opportunity:")
report({"A": 0.5, "B": 0.41})
```

```output
shared threshold 0.5:
  A: approval 0.50  TPR 0.91  FPR 0.16
  B: approval 0.25  TPR 0.72  FPR 0.05
group thresholds chosen for equal opportunity:
  A: approval 0.50  TPR 0.91  FPR 0.16
  B: approval 0.41  TPR 0.91  FPR 0.20
```

Lowering B's threshold equalises the true-positive rate (0.91 for both), but approval rates (0.50 vs 0.41) and false-positive rates (0.16 vs 0.20) still differ — fixing one criterion moves the others.

## Mitigation strategies

- **Pre-processing** — fix the data: collect more representative samples, re-weight or re-sample, remove or transform proxy features, audit labels.
- **In-processing** — add fairness constraints or penalties during training (e.g. adversarial debiasing).
- **Post-processing** — adjust decision thresholds per group (legal constraints vary by country and domain).
- **Process** — diverse teams, impact assessments, documentation (**model cards**, **datasheets for datasets**), human review for high-stakes decisions, monitoring after deployment.

## Explainability (XAI)

- **Interpretable models** — linear models, small trees, rule lists.
- **Global explanations** — feature importance, partial dependence plots.
- **Local explanations** — why *this* prediction: **LIME** (fits a simple model around one example), **SHAP** (Shapley-value attributions), counterfactuals ("you'd be approved if income were ₹X higher").

Explanations help debugging, trust and contestability — but post-hoc explanations are approximations, not guarantees.

## Privacy, safety and accountability

- **Privacy** — minimise and anonymise data (re-identification is easier than people think); **differential privacy** adds calibrated noise; **federated learning** trains without centralising raw data; regulations such as the EU's GDPR and India's Digital Personal Data Protection Act 2023 set obligations.
- **Robustness and security** — adversarial examples, data poisoning, prompt injection, model theft.
- **Generative AI risks** — hallucinations, deepfakes and misinformation, copyright questions, harmful content, over-reliance.
- **Accountability** — clear ownership, audit trails, the ability to appeal automated decisions; risk-based regulation such as the **EU AI Act**.
- **Broader impacts** — labour and economic effects, energy use of large models, concentration of power, long-term safety and alignment of increasingly capable systems.

> [!WARNING]
> - "We removed the sensitive attribute, so the model is fair" (proxies remain — and you then can't even measure bias).
> - Reporting one overall accuracy without per-group breakdowns.
> - Treating fairness as a one-time check instead of ongoing monitoring.
> - Picking a fairness metric because it is easy to satisfy rather than because it fits the harm.

## Interview questions

> [!INTERVIEW] How can an ML model be biased if the algorithm is neutral?
> The model learns patterns in its data: historical discrimination, unrepresentative samples, biased labels, proxy features and feedback loops all flow into predictions even though the optimisation itself is "neutral".

> [!INTERVIEW] Demographic parity vs equal opportunity?
> Demographic parity equalises approval rates across groups regardless of qualification; equal opportunity equalises the true positive rate — qualified individuals have equal chances. With different base rates they usually conflict.

> [!INTERVIEW] How would you make a hiring model fairer?
> Audit the data and outcomes per group; remove or test proxy features; choose a fairness criterion with stakeholders; apply re-weighting, constrained training or threshold adjustment; add human review and explanations; monitor after deployment and allow appeals.

> [!REMEMBER]
> Bias enters through data, labels, proxies and feedback loops · demographic parity / equal opportunity / equalized odds / calibration — can't have all · mitigate pre-, in-, post-processing · explain (LIME, SHAP), protect privacy, monitor, stay accountable.
