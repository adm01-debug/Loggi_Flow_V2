# Disaster Recovery Runbook

## RPO & RTO
- **RPO (Recovery Point Objective)**: 24 hours (daily automatic backups by Lovable/Supabase).
- **RTO (Recovery Time Objective)**: 4 hours to restore full service.

## Recovery Steps
1. **Infrastructure**: Lovable Cloud manages core infrastructure. In case of region failure, notify Lovable Support.
2. **Database Restore**: Use the Supabase dashboard to restore the most recent daily backup.
3. **Edge Functions**: Redeploy all functions from the GitHub repository using CLI or Lovable interface.
4. **DNS/Frontend**: Verified through Lovable Cloud dashboard.

## Health Monitoring
- Monitor status via `/functions/v1/health`.
