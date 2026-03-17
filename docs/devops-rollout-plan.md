# DevOps Rollout Plan

Last updated: March 17, 2026

## 1. Executive Summary

- Change type: Application deployment (API + frontend containers), optional infrastructure updates (Bicep).
- Environments: dev -> staging -> production.
- Deployment model: Azure DevOps CI/CD with image push to ACR and deploy to Azure Container Apps.
- Expected downtime: None for app-only rollout, low risk of brief disruption during infra changes/revision warm-up.
- Estimated duration: 30-60 minutes per environment.
- Risk level: Medium.

## 2. Inputs (Fill Before Rollout)

- Release ID: [RELEASE_ID]
- Change summary: [CHANGE_SUMMARY]
- Environment: [dev|staging|prod]
- Region: [AZURE_REGION]
- imageVersion: [IMAGE_VERSION]
- api image tag: [API_IMAGE_TAG]
- frontend image tag: [FRONTEND_IMAGE_TAG]
- Acr name: [ACR_NAME]
- Environment suffix: [ENV_SUFFIX]
- Deployment window start/end: [WINDOW]
- Rollback image tags (known-good): [ROLLBACK_API_TAG], [ROLLBACK_FE_TAG]

## 3. Approvals and Prerequisites

### Required approvals

- Technical lead: [NAME]
- DevOps owner: [NAME]
- Security reviewer (if infra/security changes): [NAME]
- Product/business owner (production): [NAME]

### Prerequisites

- CI succeeded for target version (Scan, Test, E2E, Build).
- Images exist in ACR for API and frontend target tags.
- Infra templates validated for target environment.
- Database backup/restore point confirmed (production required).
- On-call roster active and escalation path confirmed.

## 4. Preflight Checks (Go/No-Go)

Mark each item before deployment:

- [ ] Current environment healthy (frontend/API accessible).
- [ ] Health endpoint baseline recorded.
- [ ] Error rate and latency baseline captured.
- [ ] Required secrets/variables available for target environment.
- [ ] Firebase build-time variables verified for frontend image build.
- [ ] Rollback tags verified and deployable.
- [ ] Stakeholder start notice sent.

Go/No-Go decision:

- Decision: [GO|NO-GO]
- Approved by: [NAME]
- Time: [TIME]

## 5. Step-by-Step Rollout Procedure

### Phase A: Pre-deployment

1. Confirm release inputs in section 2.
2. Confirm target environment and change window.
3. Validate infra drift/what-if if IaC changes are included.
4. Confirm rollback tags and rollback owner.

### Phase B: Deployment

1. Trigger CD Push stage (images to ACR).
2. Trigger CD Deploy stage (Bicep + app rollout).
3. Verify API revision reaches healthy state.
4. Verify frontend revision reaches healthy state.

### Phase C: Progressive verification

1. Frontend smoke test (home/login route loads).
2. Auth smoke test (OAuth flow starts and returns).
3. API smoke test (health + authenticated contacts calls).
4. CRUD smoke test (list/add/delete contact).
5. Confirm no sustained error spikes.

## 6. Verification Signals

### Immediate (0-2 min)

- [ ] Deployment stages complete successfully.
- [ ] Container apps show healthy revisions.
- [ ] Health probes pass.

### Short-term (2-5 min)

- [ ] Frontend endpoint responds.
- [ ] API endpoint responds.
- [ ] Login flow functional.

### Medium-term (5-15 min)

- [ ] Error rate stable vs baseline.
- [ ] Latency stable vs baseline.
- [ ] No abnormal restarts.

### Long-term (15+ min)

- [ ] User critical journeys stable.
- [ ] No new alerts tied to rollout.
- [ ] Capacity/scaling behavior acceptable.

## 7. Rollback Plan

### Rollback triggers

Initiate rollback if any condition persists beyond agreed threshold:

- User-facing outage > 5 minutes.
- Sustained elevated 5xx/error rates.
- Auth failures break critical user flow.
- Data inconsistency in contact operations.

### Rollback procedure

1. Redeploy previous known-good API and frontend image tags.
2. Re-run deployment with rollback parameters.
3. If caused by infra change, revert to previous IaC state.
4. Re-run smoke and health checks.

Rollback record:

- Trigger reason: [REASON]
- Rollback start: [TIME]
- Rollback complete: [TIME]
- Verified by: [NAME]

## 8. Communication Plan

### T-24h (or prior agreed interval)

- Send deployment notice with scope, risk, and expected impact.

### T-15m

- Send deployment start reminder and expected duration.

### During deployment

- Send updates every 10-15 minutes:
  - Preflight complete
  - Deploy in progress
  - Verification in progress

### Completion

- Send success notice with release/version, environment, and key metrics.

### If rollback

- Send incident notice immediately.
- Send rollback complete and stabilization summary.

## 9. Environment-Specific Run Checklist

### Dev

- [ ] Deploy to dev.
- [ ] Run full smoke + integration checks.
- [ ] Capture issues and remediation actions.

### Staging

- [ ] Deploy to staging after clean dev validation.
- [ ] Run regression and non-functional checks.
- [ ] Confirm production readiness sign-off.

### Production

- [ ] Confirm all approvals.
- [ ] Execute within approved change window.
- [ ] Execute enhanced monitoring during and after rollout.

## 10. Contingency Scenarios

### Scenario A: Frontend healthy, API unhealthy

- Symptoms: frontend loads, API calls fail.
- Action: rollback API image first, verify API health, then retest frontend flows.

### Scenario B: Performance degradation

- Symptoms: high latency/timeouts without full outage.
- Action: scale replicas, inspect DB pressure, evaluate rollback if persistent.

### Scenario C: Auth dependency issue

- Symptoms: OAuth failures across users.
- Action: pause progression, assess provider status, rollback if user impact persists.

### Scenario D: Infra deployment partial failure

- Symptoms: deploy stage completes partially, resource drift present.
- Action: stop promotion, revert or repair infra state, rerun validation.

## 11. Contacts and Escalation

- Deployment lead: [NAME] [CONTACT]
- Secondary lead: [NAME] [CONTACT]
- API owner: [NAME] [CONTACT]
- Frontend owner: [NAME] [CONTACT]
- Database owner: [NAME] [CONTACT]
- Cloud/platform owner: [NAME] [CONTACT]
- Security on-call: [NAME] [CONTACT]

Escalation path:

1. Deployment lead
2. Platform owner
3. Engineering manager
4. Security/compliance (if security-impacting)

## 12. Post-Deployment Tasks

### Within 1 hour

- [ ] Validate all success criteria.
- [ ] Review logs and key metrics for anomalies.
- [ ] Confirm no latent auth or data regressions.

### Within 24 hours

- [ ] Monitor trend metrics and error classes.
- [ ] Confirm stability and no hidden regressions.

### Within 1 week

- [ ] Run post-deployment review.
- [ ] Document lessons learned and pipeline improvements.
- [ ] Update this runbook if process changes were identified.
