import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import scoringMock from '../features/scoringMock.js';

const ScoreSummary = ({ scores, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  const summary = scoringMock.summarize(scores);

  return (
    <Box mt={4} borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={3}>
        セッション採点サマリー
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
        <Stat>
          <StatLabel>ベクトル平均</StatLabel>
          <StatNumber>{summary.averageVector}</StatNumber>
          <StatHelpText>0-100 スケール</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>チェック平均</StatLabel>
          <StatNumber>{summary.averageChecklist}</StatNumber>
          <StatHelpText>項目達成度</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>総合平均</StatLabel>
          <StatNumber>{summary.averageTotal}</StatNumber>
          <StatHelpText>重み付き集計</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
};

export default ScoreSummary;
