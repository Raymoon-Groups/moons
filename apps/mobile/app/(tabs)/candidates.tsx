import { AppScreen } from '@/components/app-screen';
import { AuthenticatedScreen } from '@/components/authenticated-screen';
import { LoadingScreen } from '@/components/loading-screen';
import { RecruiterCandidatesScreen } from '@/components/recruiter/recruiter-candidates-screen';

export default function CandidatesTabScreen() {
  return (
    <AppScreen>
      <AuthenticatedScreen>
        <RecruiterCandidatesScreen />
      </AuthenticatedScreen>
    </AppScreen>
  );
}
