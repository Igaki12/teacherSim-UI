import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import scoringMock from '../features/scoringMock.js';

const mockHistory = [
  {
    id: '2024-04-12',
    title: '教室内のトラブル対応',
    total: 72
  },
  {
    id: '2024-05-01',
    title: '保護者面談（学習状況）',
    total: 78
  },
  {
    id: '2024-06-18',
    title: '特別支援コミュニケーション',
    total: 81
  }
];

const ProgressDashboard = ({ scores, isVisible }) => {
  if (!isVisible) {
    return (
      <Alert status="info" borderRadius="md" mt={4} variant="subtle">
        <AlertIcon />
        <Box>
          <AlertTitle>採点完了後に表示されます</AlertTitle>
          <AlertDescription>
            セッションを終了するとこれまでの推移と比較できます。
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  const summary = scoringMock.summarize(scores);
  const combinedHistory = [
    ...mockHistory,
    { id: '今回', title: '今回のセッション', total: summary.averageTotal }
  ];
  const maxScore = Math.max(...combinedHistory.map((item) => item.total), 1);
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box mt={4} borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={3}>
        スコア推移ダッシュボード（ダミー）
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Stack spacing={3}>
          <Heading size="xs" color="gray.500">
            スパークライン（擬似）
          </Heading>
          <HStack align="flex-end" spacing={2} minH="120px">
            {combinedHistory.map((item) => (
              <Box
                key={item.id}
                flex="1"
                bg="blue.200"
                _dark={{ bg: 'blue.500' }}
                height={`${(item.total / maxScore) * 100}%`}
                borderRadius="sm"
                aria-label={`${item.title} スコア ${item.total}`}
              />
            ))}
          </HStack>
        </Stack>
        <Stack spacing={3}>
          <Heading size="xs" color="gray.500">
            セッション履歴（ダミー）
          </Heading>
          <Stack spacing={3}>
            {combinedHistory.map((item) => (
              <Box
                key={item.id}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={3}
              >
                <Text fontWeight="medium">{item.title}</Text>
                <Text fontSize="xs" color="gray.500">
                  {item.id}
                </Text>
                <Progress
                  mt={2}
                  value={(item.total / maxScore) * 100}
                  colorScheme={item.id === '今回' ? 'green' : 'blue'}
                  size="sm"
                  aria-label={`${item.title} のスコア`}
                />
                <Text fontSize="sm" mt={1}>
                  総合 {Math.round(item.total)}
                </Text>
              </Box>
            ))}
          </Stack>
        </Stack>
      </SimpleGrid>
    </Box>
  );
};

export default ProgressDashboard;
