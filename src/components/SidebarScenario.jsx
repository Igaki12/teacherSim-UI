import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Divider,
  Heading,
  List,
  ListItem,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { CheckIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay
} from '@chakra-ui/react';
import useAppStore from '../store/useAppStore.js';
import scenarios, { getScenarioById } from '../features/scenarios.js';

const SidebarScenario = ({ onClose, onRequestTrainingEnd, canEndTraining }) => {
  const { started, startScenario, currentScenarioId, resetSession } =
    useAppStore((state) => ({
      started: state.started,
      startScenario: state.startScenario,
      currentScenarioId: state.currentScenarioId,
      resetSession: state.resetSession
    }));
  const [previewId, setPreviewId] = useState(currentScenarioId ?? scenarios[0]?.id);
  const resetDisclosure = useDisclosure();
  const cancelRef = useRef();

  const activeScenario = useMemo(
    () => getScenarioById(previewId),
    [previewId]
  );

  const handleStart = () => {
    if (activeScenario) {
      startScenario(activeScenario.id);
      onClose?.();
    }
  };

  const handleReset = () => {
    resetSession();
    resetDisclosure.onClose();
  };

  const locked = started;
  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      aria-label="シナリオ選択"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <Box px={4} py={4} borderBottomWidth="1px">
        <Heading size="sm">シナリオ</Heading>
      </Box>
      <Stack
        direction={{ base: 'column' }}
        spacing={0}
        flex="1"
        minH={0}
        overflow="hidden"
      >
        <Box
          flex="0 0 40%"
          borderRightWidth="1px"
          borderBottomWidth="1px"
          maxH={{ base: '35vh', md: '50%' }}
          overflowY="auto"
          display={started ? 'none' : 'block'}
        >
          <List spacing={0}>
            {scenarios.map((scenario) => {
              const isActive = scenario.id === previewId;
              return (
                <ListItem
                  key={scenario.id}
                  px={4}
                  py={3}
                  role="button"
                  onClick={() => !locked && setPreviewId(scenario.id)}
                  aria-pressed={isActive}
                  bg={isActive ? 'blue.50' : 'transparent'}
                  cursor={locked ? 'not-allowed' : 'pointer'}
                  opacity={locked && scenario.id !== currentScenarioId ? 0.4 : 1}
                >
                  <Stack spacing={1}>
                    <Text fontWeight="semibold">{scenario.title}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {scenario.description.slice(0, 36)}...
                    </Text>
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        </Box>
        <Box flex="1" px={4} py={4} overflowY="auto" minH={0}>
          {locked && (
            <Alert status="warning" variant="left-accent" mb={3}>
              <AlertIcon />
              <Stack spacing={1}>
                <AlertTitle>ロック中</AlertTitle>
                <AlertDescription>
                  トレーニング中はシナリオを変更できません。終了後にリセットしてください。
                </AlertDescription>
              </Stack>
            </Alert>
          )}
          {activeScenario ? (
            <Stack spacing={3}>
              <Heading size="sm">{activeScenario.title}</Heading>
              <Text fontSize="sm" color="gray.600">
                {activeScenario.description}
              </Text>
              <Divider />
              <Stack spacing={2}>
                <Heading size="xs">登場人物</Heading>
                <Stack spacing={1} fontSize="sm">
                  {activeScenario.actors.map((actor) => (
                    <Text key={actor}>・{actor}</Text>
                  ))}
                </Stack>
              </Stack>
              <Stack spacing={2}>
                <Heading size="xs">ゴール</Heading>
                <Stack spacing={1} fontSize="sm">
                  {activeScenario.goals.map((goal) => (
                    <Text key={goal}>・{goal}</Text>
                  ))}
                </Stack>
              </Stack>
              <Stack spacing={2}>
                <Heading size="xs">評価観点</Heading>
                <Stack spacing={1} fontSize="sm">
                  {activeScenario.rubric.map((rubric) => (
                    <Text key={rubric}>・{rubric}</Text>
                  ))}
                </Stack>
              </Stack>
              <Stack spacing={2}>
                <Heading size="xs">オープニング例</Heading>
                <Stack spacing={1} fontSize="sm">
                  {activeScenario.sampleOpenings.map((opening) => (
                    <Text key={opening}>&ldquo;{opening}&rdquo;</Text>
                  ))}
                </Stack>
              </Stack>
              <Divider />
              <Stack spacing={2}>
                {!started && (
                  <Button colorScheme="blue" onClick={handleStart}>
                    この状況で開始
                  </Button>
                )}
                {canEndTraining && (
                  <Button
                    colorScheme="green"
                    leftIcon={<CheckIcon />}
                    onClick={onRequestTrainingEnd}
                  >
                    トレーニング終了
                  </Button>
                )}
                {started && (
                  <Button
                    colorScheme="red"
                    variant="outline"
                    leftIcon={<RepeatIcon />}
                    onClick={resetDisclosure.onOpen}
                  >
                    リセット
                  </Button>
                )}
                {currentScenarioId && (
                  <Box
                    alignSelf="stretch"
                    px={3}
                    py={1}
                    bg="purple.50"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="purple.200"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="purple.700"
                      noOfLines={1}
                      title={currentScenarioId}
                    >
                      現在のシナリオ: {currentScenarioId}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Stack>
          ) : (
            <Text fontSize="sm" color="gray.500">
              シナリオが見つかりません。
            </Text>
          )}
        </Box>
      </Stack>

      <AlertDialog
        isOpen={resetDisclosure.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={resetDisclosure.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              セッションのリセット
            </AlertDialogHeader>
            <AlertDialogBody>
              全ての履歴と採点が消えます。よろしいですか？
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={resetDisclosure.onClose}>
                いいえ
              </Button>
              <Button colorScheme="red" ml={3} onClick={handleReset}>
                リセットする
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SidebarScenario;
