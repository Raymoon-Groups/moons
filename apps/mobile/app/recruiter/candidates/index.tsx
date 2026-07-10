import { AppScreen } from '@/components/app-screen';
import { RecruiterCandidatesScreen } from '@/components/recruiter/recruiter-candidates-screen';

export default function CandidatesScreen() {
  return (
    <AppScreen>
      <RecruiterCandidatesScreen showHeader={false} />
    </AppScreen>
  );
}
