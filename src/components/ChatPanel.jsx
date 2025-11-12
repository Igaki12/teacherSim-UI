import {
  Badge,
  Box,
  HStack,
  Spinner,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef } from 'react';
import useAppStore from '../store/useAppStore.js';
import ScoreSummary from './ScoreSummary.jsx';
import ChatComposer from './ChatComposer.jsx';

const ChatPanel = () => {
  const { trainingEnded, messages, scores, isChatSending } = useAppStore(
    (state) => ({
      trainingEnded: state.trainingEnded,
      messages: state.messages,
      scores: state.scores,
      isChatSending: state.isChatSending
    })
  );
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
                    {/* <ScorePerUtterance score={scoreMap.get(message.id)} /> */}
                  </Stack>
                </Box>
              );
            })}
            {isChatSending && (
              <HStack spacing={2} color="gray.500">
                <Spinner size="sm" />
                <Text fontSize="sm">応答を生成しています…</Text>
              </HStack>
            )}
          </Stack>
        </Box>
      </Box>

      <ChatComposer />

      <ScoreSummary scores={scores} isVisible={trainingEnded} />
    </Stack>
  );
};

export default ChatPanel;
