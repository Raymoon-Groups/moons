'use client';

import type { ReactNode } from 'react';
import { resolveAssetUrl } from '@/lib/assets';
import type { Profile } from '@/lib/types';
import { formatExperience, getResumeDisplayName } from './profile-shared';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
      <h3 className="text-base font-bold text-heading">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-heading">{value}</p>
    </div>
  );
}

export function CandidateProfileReadonly({ profile }: { profile: Profile }) {
  const displayName = profile.fullName?.trim() || profile.email.split('@')[0];
  const avatarSrc = profile.avatarUrl ? resolveAssetUrl(profile.avatarUrl) : null;
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;
  const resumeFileName = getResumeDisplayName(profile);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface ring-2 ring-moons-blue/10">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-moons-blue text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">
              Candidate profile
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-heading">{displayName}</h2>
            {profile.headline && (
              <p className="mt-2 text-sm text-foreground">{profile.headline}</p>
            )}
            <p className="mt-2 text-sm text-moons-muted">
              {[profile.currentCompany, profile.location]
                .filter(Boolean)
                .join(' · ')}
              {profile.experienceYears != null &&
                ` · ${formatExperience(profile.experienceYears)}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="text-foreground">{profile.email}</span>
              {profile.phone && <span className="text-foreground">{profile.phone}</span>}
            </div>

            {resumeUrl && resumeFileName && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex max-w-full rounded-lg bg-moons-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-moons-blue-dark"
              >
                <span className="truncate">{resumeFileName}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <Section title="Career snapshot">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Current company" value={profile.currentCompany} />
          <DetailItem label="Notice period" value={profile.noticePeriod} />
          <DetailItem label="Current CTC" value={profile.currentCtc} />
          <DetailItem label="Expected CTC" value={profile.expectedCtc} />
        </div>
      </Section>

      {profile.summary && (
        <Section title="Profile summary">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {profile.summary}
          </p>
        </Section>
      )}

      {profile.workExperiences.length > 0 && (
        <Section title="Employment history">
          <div className="space-y-3">
            {profile.workExperiences.map((exp, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface/40 p-4">
                <p className="font-semibold text-heading">{exp.designation}</p>
                <p className="text-sm text-foreground">{exp.company}</p>
                <p className="mt-1 text-xs text-moons-muted">
                  {exp.startDate}
                  {' — '}
                  {exp.isCurrent ? 'Present' : exp.endDate}
                </p>
                {exp.description && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {profile.educations.length > 0 && (
        <Section title="Education">
          <div className="space-y-4">
            {profile.educations.map((edu, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface/40 px-4 py-3">
                <p className="font-semibold text-heading">
                  {edu.degree}
                  {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {edu.institute} · {edu.year}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {profile.skills.length > 0 && (
        <Section title="Key skills">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-moons-blue"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {(profile.preferredRoles.length > 0 ||
        profile.preferredLocations.length > 0 ||
        profile.preferredIndustries.length > 0) && (
        <Section title="Job preferences">
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.preferredRoles.length > 0 && (
              <DetailItem label="Preferred roles" value={profile.preferredRoles.join(', ')} />
            )}
            {profile.preferredLocations.length > 0 && (
              <DetailItem
                label="Preferred locations"
                value={profile.preferredLocations.join(', ')}
              />
            )}
            {profile.preferredIndustries.length > 0 && (
              <DetailItem
                label="Preferred industries"
                value={profile.preferredIndustries.join(', ')}
              />
            )}
          </div>
        </Section>
      )}

      {profile.certifications.length > 0 && (
        <Section title="Certifications">
          <div className="space-y-3">
            {profile.certifications.map((cert, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface/40 px-4 py-3">
                <p className="text-sm font-semibold text-heading">{cert.name}</p>
                <p className="mt-1 text-sm text-moons-muted">
                  {[cert.issuer, cert.year ? String(cert.year) : null].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
