import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreeningQuestionType, type ScreeningQuestion } from '@moons/shared';
import { SelectField } from '@/components/profile/select-field';
import { FieldLabel, Input, PrimaryButton } from '@/components/ui';
import { useTheme } from '@/lib/theme-context';

const TYPE_OPTIONS = [
  { label: 'Short text', value: ScreeningQuestionType.TEXT },
  { label: 'Yes / No', value: ScreeningQuestionType.YES_NO },
  { label: 'Single choice', value: ScreeningQuestionType.SINGLE_CHOICE },
];

function newQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function typeLabel(type: ScreeningQuestionType) {
  switch (type) {
    case ScreeningQuestionType.YES_NO:
      return 'Yes / No';
    case ScreeningQuestionType.SINGLE_CHOICE:
      return 'Single choice';
    case ScreeningQuestionType.RESUME:
      return 'Resume upload';
    default:
      return 'Text';
  }
}

export function ScreeningQuestionsEditor({
  askForCv,
  onAskForCvChange,
  questions,
  onChange,
}: {
  askForCv: boolean;
  onAskForCvChange: (value: boolean) => void;
  questions: ScreeningQuestion[];
  onChange: (next: ScreeningQuestion[]) => void;
}) {
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState(ScreeningQuestionType.TEXT);
  const [optionsText, setOptionsText] = useState('');

  const totalCount = questions.length + (askForCv ? 1 : 0);

  function addQuestion() {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return;
    if (totalCount >= 10) return;

    const options =
      type === ScreeningQuestionType.SINGLE_CHOICE
        ? optionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 8)
        : undefined;

    if (type === ScreeningQuestionType.SINGLE_CHOICE && (!options || options.length < 2)) {
      return;
    }

    onChange([
      ...questions,
      {
        id: newQuestionId(),
        prompt: trimmed,
        type,
        required: true,
        options,
        sortOrder: questions.length,
      },
    ]);
    setPrompt('');
    setOptionsText('');
    setType(ScreeningQuestionType.TEXT);
  }

  return (
    <View>
      <FieldLabel>Application questions</FieldLabel>
      <Pressable
        onPress={() => onAskForCvChange(!askForCv)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: askForCv ? colors.blue : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {askForCv ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
        </View>
        <Text style={{ color: colors.foreground, flex: 1 }}>
          Ask candidates to upload their latest CV
        </Text>
      </Pressable>

      {questions.map((q) => (
        <View
          key={q.id}
          style={{
            marginBottom: 8,
            padding: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>{typeLabel(q.type)}</Text>
          <Text style={{ color: colors.heading, marginBottom: 6 }}>{q.prompt}</Text>
          {q.options?.length ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
              Options: {q.options.join(' · ')}
            </Text>
          ) : null}
          <Pressable onPress={() => onChange(questions.filter((x) => x.id !== q.id))}>
            <Text style={{ color: colors.error, fontSize: 12 }}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <SelectField
        label="Question type"
        value={type}
        options={TYPE_OPTIONS}
        onChange={(value) => setType(value as ScreeningQuestionType)}
      />
      <Input
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Add a custom question…"
      />
      {type === ScreeningQuestionType.SINGLE_CHOICE ? (
        <>
          <FieldLabel>Choices (one per line, min 2)</FieldLabel>
          <Input
            value={optionsText}
            onChangeText={setOptionsText}
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
            placeholder={'Option A\nOption B\nOption C'}
          />
        </>
      ) : null}
      <PrimaryButton
        label={totalCount >= 10 ? 'Question limit reached' : 'Add question'}
        onPress={addQuestion}
      />
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
        {totalCount}/10 questions (including CV upload if enabled)
      </Text>
    </View>
  );
}

export function buildScreeningQuestions(
  askForCv: boolean,
  customQuestions: ScreeningQuestion[],
): ScreeningQuestion[] {
  const list: ScreeningQuestion[] = [];
  if (askForCv) {
    list.push({
      id: newQuestionId(),
      prompt: 'Upload your latest CV / resume',
      type: ScreeningQuestionType.RESUME,
      required: true,
      sortOrder: 0,
    });
  }
  customQuestions.forEach((q) => {
    list.push({ ...q, sortOrder: list.length });
  });
  return list.map((q, index) => ({ ...q, sortOrder: index }));
}
