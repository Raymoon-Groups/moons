'use client';

import { resolveAssetUrl } from '@/lib/assets';
import type { Profile } from '@/lib/types';
import { formatExperience } from './profile-shared';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface-elevated shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-bold text-moons-navy">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-moons-muted">{label}</p>
      <p className="mt-1 text-sm text-moons-silver">{value}</p>
    </div>
  );
}

export function CandidateProfileReadonly({ profile }: { profile: Profile }) {
  const displayName = profile.fullName?.trim() || profile.email.split('@')[0];
  const avatarSrc = profile.avatarUrl ? resolveAssetUrl(profile.avatarUrl) : null;
  const resumeUrl = profile.resumeUrl ? resolveAssetUrl(profile.resumeUrl) : null;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-surface-elevated p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-moons-blue/20">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-moons-blue text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-moons-navy">{displayName}</h2>
            {profile.headline && (
              <p className="text-sm text-foreground">{profile.headline}</p>
            )}
            <p className="mt-1 text-sm text-moons-muted">
              {[profile.currentCompany, profile.location]
                .filter(Boolean)
                .join(' · ')}
              {profile.experienceYears != null &&
                ` · ${formatExperience(profile.experienceYears)}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="text-foreground">{profile.email}</span>
              {profile.phone && <span className="text-foreground">{profile.phone}</span>}
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-moons-blue hover:underline"
                >
                  Download resume
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Section title="Career snapshot">
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Current company" value={profile.currentCompany} />
          <Detail label="Notice period" value={profile.noticePeriod} />
          <Detail label="Current CTC" value={profile.currentCtc} />
          <Detail label="Expected CTC" value={profile.expectedCtc} />
        </div>
      </Section>

      {profile.workExperiences.length > 0 && (
        <Section title="Employment history">
          <div className="space-y-4">
            {profile.workExperiences.map((exp, i) => (
              <div key={i} className="rounded-lg bg-surface p-4">
                <p className="font-semibold text-moons-navy">{exp.designation}</p>
                <p className="text-sm text-foreground">{exp.company}</p>
                <p className="mt-1 text-xs text-moons-muted">
                  {exp.startDate}
                  {' — '}
                  {exp.isCurrent ? 'Present' : exp.endDate}
                </p>
                {exp.description && (
                  <p className="mt-2 text-sm text-foreground">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {profile.educations.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {profile.educations.map((edu, i) => (
              <div key={i}>
                <p className="font-semibold text-moons-navy">
                  {edu.degree}
                  {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                </p>
                <p className="text-sm text-foreground">
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
                className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-moons-blue"
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
          <div className="space-y-3 text-sm text-moons-silver">
            {profile.preferredRoles.length > 0 && (
              <p>
                <span className="font-medium">Roles:</span>{' '}
                {profile.preferredRoles.join(', ')}
              </p>
            )}
            {profile.preferredLocations.length > 0 && (
              <p>
                <span className="font-medium">Locations:</span>{' '}
                {profile.preferredLocations.join(', ')}
              </p>
            )}
            {profile.preferredIndustries.length > 0 && (
              <p>
                <span className="font-medium">Industries:</span>{' '}
                {profile.preferredIndustries.join(', ')}
              </p>
            )}
          </div>
        </Section>
      )}

      {profile.certifications.length > 0 && (
        <Section title="Certifications">
          <div className="space-y-2">
            {profile.certifications.map((cert, i) => (
              <p key={i} className="text-sm text-moons-silver">
                <span className="font-medium">{cert.name}</span>
                {cert.issuer ? ` — ${cert.issuer}` : ''}
                {cert.year ? ` (${cert.year})` : ''}
              </p>
            ))}
          </div>
        </Section>
      )}

      {profile.summary && (
        <Section title="Profile summary">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {profile.summary}
          </p>
        </Section>
      )}
    </div>
  );
}
