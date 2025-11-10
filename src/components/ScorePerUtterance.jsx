import {
  Badge,
  Box,
  HStack,
  Progress,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

const ScorePerUtterance = ({ score }) => {
  if (!score) return null;
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
      mt={2}
      aria-label="発話採点"
    >
      <HStack spacing={3} justify="space-between">
        <Badge colorScheme="purple">総合 {score.total}</Badge>
        <HStack spacing={2} fontSize="xs">
          <Text>ベクトル {score.vectorScore}</Text>
          <Text>|</Text>
          <Text>チェック {score.checklistScore}</Text>
        </HStack>
      </HStack>
      <Stack spacing={1.5} mt={3}>
        {score.checklist.map((item) => (
          <Box key={item.id}>
            <HStack justify="space-between">
              <Text fontSize="xs" color="gray.500">
                {item.label}
              </Text>
              <Badge
                colorScheme={item.achieved >= 0.8 ? 'green' : 'orange'}
                fontSize="0.6rem"
              >
                {Math.round(item.achieved * 100)}%
              </Badge>
            </HStack>
            <Progress
              value={item.achieved * 100}
              size="xs"
              colorScheme={item.achieved >= 0.8 ? 'green' : 'orange'}
              aria-label={`${item.label}の達成度`}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default ScorePerUtterance;
