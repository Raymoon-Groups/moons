import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { AppScreen } from '@/components/app-screen';
import { RecruiterCandidatesScreen } from '@/components/recruiter/recruiter-candidates-screen';

export default function CandidatesScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Candidates' });
  }, [navigation]);

  return (
    <AppScreen>
      <RecruiterCandidatesScreen showHeader={false} />
    </AppScreen>
  );
}
