import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import useAppStore from '../store/useAppStore.js';
import chatMock from '../features/chatMock.js';
import scoringMock from '../features/scoringMock.js';
import ScorePerUtterance from './ScorePerUtterance.jsx';
import ScoreSummary from './ScoreSummary.jsx';

const ChatPanel = () => {
  const {
    started,
    trainingEnded,
    currentScenarioId,
    messages,
    scores,
    addMessage,
    addScore
  } = useAppStore((state) => ({
    started: state.started,
    trainingEnded: state.trainingEnded,
    currentScenarioId: state.currentScenarioId,
    messages: state.messages,
    scores: state.scores,
    addMessage: state.addMessage,
    addScore: state.addScore
  }));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const toast = useToast();
  const logRef = useRef();

  const scoreMap = useMemo(() => {
    const map = new Map();
    scores.forEach((score) => {
      map.set(score.messageId, score);
    });
    return map;
  }, [scores]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages.length]);

  const sendMessage = async () => {
    if (!started) {
      toast({
        status: 'warning',
        title: 'シナリオを開始してください',
        description: 'シナリオを開始するとチャットが利用できます。'
      });
      return;
    }
    const text = input.trim();
    if (!text) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    addMessage(userMessage);
    addScore(scoringMock.score(userMessage));
    setInput('');
    setIsSending(true);
    try {
      const reply = await chatMock.reply({
        text,
        scenarioId: currentScenarioId
      });
      addMessage(reply);
      addScore(scoringMock.score(reply));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  const bubbleBgUser = useColorModeValue('blue.500', 'blue.300');
  const bubbleColorUser = useColorModeValue('white', 'gray.900');
  const bubbleBgAssistant = useColorModeValue('gray.100', 'gray.700');

  return (
    <Stack spacing={4} height="100%" role="region" aria-label="チャットパネル" bg={useColorModeValue('white', 'gray.900')} p={4}>
      <Box
        flex="1"
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <Box
          px={4}
          py={3}
          borderBottomWidth="1px"
          background={useColorModeValue('white', 'gray.800')}
        >
          <Text fontWeight="medium">チャット履歴</Text>
          <Text fontSize="xs" color="gray.500">
            Enter で送信、Shift+Enter で改行。新着メッセージは自動で読み上げ領域に追加されます。
          </Text>
        </Box>
        <Box
          ref={logRef}
          flex="1"
          overflowY="auto"
          px={4}
          py={4}
          role="log"
          aria-live="polite"
        >
          <Stack spacing={4}>
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const bubbleBg = isUser ? bubbleBgUser : bubbleBgAssistant;
              const bubbleColor = isUser ? bubbleColorUser : 'inherit';
              return (
                <Box key={message.id}>
                  <Stack
                    align={isUser ? 'flex-end' : 'flex-start'}
                    textAlign={isUser ? 'right' : 'left'}
                  >
                    <Box
                      bg={bubbleBg}
                      color={bubbleColor}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      maxW="100%"
                      boxShadow="sm"
                    >
                      <Text fontSize="xs" opacity={0.7}>
                        {isUser ? 'あなた' : 'ロールプレイ相手'}
                      </Text>
                      <Text whiteSpace="pre-wrap">{message.text}</Text>
                      <Badge mt={1} colorScheme={isUser ? 'blue' : 'gray'}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Badge>
                    </Box>
                    <ScorePerUtterance score={scoreMap.get(message.id)} />
                  </Stack>
                </Box>
              );
            })}
            {isSending && (
              <HStack spacing={2} color="gray.500">
                <Spinner size="sm" />
                <Text fontSize="sm">応答を生成しています…</Text>
              </HStack>
            )}
          </Stack>
        </Box>
      </Box>

      <Stack spacing={3} as="form" onSubmit={(event) => event.preventDefault()}>
        <FormControl>
          <FormLabel htmlFor="chat-input">メッセージ入力</FormLabel>
          <Input
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力してください"
            isDisabled={!started}
          />
        </FormControl>
        <HStack justify="space-between">
          <Tooltip
            label={isRecording ? '録音中（ダミー）' : '音声入力（ダミー）'}
            hasArrow
          >
            <Button
              colorScheme={isRecording ? 'red' : 'gray'}
              onClick={toggleRecording}
              variant={isRecording ? 'solid' : 'outline'}
              aria-pressed={isRecording}
            >
              音声入力
            </Button>
          </Tooltip>
          <Button
            colorScheme="blue"
            rightIcon={<ArrowUpIcon />}
            onClick={sendMessage}
            isLoading={isSending}
            isDisabled={!started}
          >
            送信
          </Button>
        </HStack>
      </Stack>

      <ScoreSummary scores={scores} isVisible={trainingEnded} />
    </Stack>
  );
};

export default ChatPanel;
