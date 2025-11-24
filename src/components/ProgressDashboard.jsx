import {
  Badge,
  Box,
  Checkbox,
  CircularProgress,
  CircularProgressLabel,
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

const vectorLabels = ['状況を整理するための発言', '意図の確認', '共感を狙った発言', '新しい提案'];
const classificationRules = [
  { label: '状況を整理するための発言', pattern: /状況|様子|クラス|教室|トラブル/ },
  { label: '意図の確認', pattern: /どういう|意図|目的|確認|でしょう/ },
  { label: '共感を狙った発言', pattern: /心配|お気持ち|大変|申し訳|寄り添い|共感/ },
  { label: '新しい提案', pattern: /提案|プラン|計画|対応策|できます|いたします/ }
];

const pickVectorLabel = (text, fallbackLabel) => {
  if (!text) return fallbackLabel;
  const rule = classificationRules.find((item) => item.pattern.test(text));
  return rule ? rule.label : fallbackLabel;
};

const ProgressDashboard = ({ scores, messages, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  const summary = scoringMock.summarize(scores);
  const combinedHistory = [
    ...mockHistory,
    { id: '今回', title: '今回のセッション', total: summary.averageTotal }
  ];
  const scoreMap = scores.reduce((map, score) => {
    map.set(score.messageId, score);
    return map;
  }, new Map());
  const userMessages = (messages || []).filter((message) => message.role === 'user');
  const recentUserMessages = userMessages.slice(-4);
  const hasRealUserScores = recentUserMessages.length > 0;
  const fallbackVectorBreakdown = new Array(4).fill(null).map((_, index) => ({
    id: `dummy-${index}`,
    label: vectorLabels[index % vectorLabels.length],
    turn: `ダミー発言 #${index + 1}`,
    vectorScore: 70 + index * 4,
    text: '最近の会話データがないため仮の指標を表示しています。',
    timestamp: null
  }));
  const vectorBreakdown = hasRealUserScores
    ? recentUserMessages.map((message, index, array) => {
      const fallbackLabel = vectorLabels[index % vectorLabels.length];
      const label = pickVectorLabel(message.text, fallbackLabel);
      const turnIndex = userMessages.length - array.length + index + 1;
      const vectorScore =
        scoreMap.get(message.id)?.vectorScore ?? 72 + (index % 4) * 5;
      return {
        id: message.id,
        label,
        turn: `送信したユーザーメッセージ #${turnIndex}`,
        vectorScore,
        text: message.text,
        timestamp: message.timestamp
      };
    })
    : fallbackVectorBreakdown;
  const deductionCandidates = [
    {
      id: 'keigo',
      label: '敬語表現の乱れ',
      hint: '語尾がカジュアルに崩れていないかチェック',
      deduction: 5,
      detected: hasRealUserScores ? summary.averageChecklist < 75 : true
    },
    {
      id: 'apology',
      label: '謝罪/共感の不足',
      hint: '相手感情の言及やクッション言葉が薄い場合に減点',
      deduction: 3,
      detected: hasRealUserScores ? summary.averageVector < 75 : false
    },
    {
      id: 'followup',
      label: '確認質問の不足',
      hint: 'Yes/No 以外の深掘りが無いと判断された箇所',
      deduction: 2,
      detected: hasRealUserScores ? summary.averageTotal < 80 : false
    }
  ];
  const maxScore = Math.max(...combinedHistory.map((item) => item.total), 1);
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const progressTrackColor = useColorModeValue('blue.50', 'blue.900');

  return (
    <Box mt={4} borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={3}>
        スコア推移ダッシュボード（ダミー）
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Stack spacing={3}>
          <Heading size="xs" color="gray.500">
            擬似ベクトル採点の流れ
          </Heading>
          <Text fontSize="sm" color="gray.600">
            ユーザーの各発言にダミーのベクトル内積計算を適用し、
            話題分類とスコア化を行った上で平均点を算出しています。
          </Text>
          <Stack spacing={2}>
            {vectorBreakdown.map((item) => (
              <Box
              bgColor={useColorModeValue('white', 'gray.900')}
                key={item.id}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="md"
                p={3}
                aria-label={`${item.turn} ${item.label} ${item.vectorScore}点`}
              >
                <Text fontSize="xs" color="gray.500">
                  {item.turn}
                </Text>
                <HStack justify="space-between" mt={1}>
                  <Text fontWeight="medium">分類：{item.label}</Text>
                  <Text fontFamily="mono">{item.vectorScore} pt</Text>
                </HStack>
                <HStack spacing={4} align="flex-start" mt={3}>
                  <Stack spacing={1} flex="1">
                    <Text fontSize="sm" noOfLines={3}>
                      {item.text || '―'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'タイムスタンプなし'}
                    </Text>
                  </Stack>
                  <CircularProgress
                    value={item.vectorScore}
                    max={100}
                    size="64px"
                    color="blue.400"
                    trackColor={progressTrackColor}
                    thickness="10px"
                    aria-label={`${item.label} スコア ${item.vectorScore}点`}
                  >
                    <CircularProgressLabel fontFamily="mono" fontSize="sm">
                      {item.vectorScore}
                    </CircularProgressLabel>
                  </CircularProgress>

                </HStack>
              </Box>
            ))}
          </Stack>
          <Box
            mt={2}
          >
            <Text fontSize="sm">
              ベクトル平均 :{' '}
              <Text as="span" fontWeight="bold">
                {summary.averageVector ? `${summary.averageVector} pt` : '―'}
              </Text>
              （話者分類の中心は{vectorBreakdown[0]?.label}領域付近という想定）
            </Text>
          </Box>
          <Box
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            p={3}
            mt={3}
          >
            <Heading size="xs" color="gray.500">
              会話全体チェック（減点シート）
            </Heading>
            <Text fontSize="sm" mt={1}>
              会話全体では「敬語表現の乱れ」などをモニターし、チェック済みの項目だけ指定点数を減点するダミー挙動です。
            </Text>
            <Stack spacing={2} mt={3}>
              {deductionCandidates.map((item) => (
                <CheckboxCard
                  key={item.id}
                  item={item}
                  borderColor={borderColor}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
        <Stack spacing={3}>
          <Heading size="xs" color="gray.500">
            セッション履歴（ダミー）
          </Heading>
          <Stack spacing={3}>
            {combinedHistory.map((item) => (
              <Box
              bgColor={useColorModeValue('white', 'gray.900')}
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

const CheckboxCard = ({ item, borderColor }) => (
  <Box
    as="label"
    borderWidth="1px"
    borderColor={borderColor}
    borderRadius="md"
    p={3}
    display="block"
    bg={item.detected ? 'red.50' : 'gray.50'}
    _dark={{
      bg: item.detected ? 'red.900' : 'gray.700'
    }}
  >
    <HStack align="flex-start" spacing={3}>
      <Checkbox
        isChecked={item.detected}
        isReadOnly
        colorScheme={item.detected ? 'red' : 'green'}
        mt={1}
        aria-label={`${item.label} ${item.detected ? '減点あり' : '問題なし'}`}
        pointerEvents="none"
      />
      <Box flex="1">
        <Text fontWeight="medium">{item.label}</Text>
        <Text fontSize="xs" color="gray.500">
          {item.hint}
        </Text>
      </Box>
      <Badge colorScheme={item.detected ? 'red' : 'green'}>
        {item.detected ? `-${item.deduction}pt` : '減点なし'}
      </Badge>
    </HStack>
  </Box>
);

export default ProgressDashboard;
