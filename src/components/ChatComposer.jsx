import { ArrowUpIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Stack,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import useAppStore from '../store/useAppStore.js';
import chatMock from '../features/chatMock.js';
import scoringMock from '../features/scoringMock.js';

const ChatComposer = ({ inputId = 'chat-input', ...props }) => {
  const {
    started,
    currentScenarioId,
    chatInput,
    isChatSending,
    isChatRecording,
    setChatInput,
    setChatSending,
    toggleChatRecording,
    addMessage,
    addScore
  } = useAppStore((state) => ({
    started: state.started,
    currentScenarioId: state.currentScenarioId,
    chatInput: state.chatInput,
    isChatSending: state.isChatSending,
    isChatRecording: state.isChatRecording,
    setChatInput: state.setChatInput,
    setChatSending: state.setChatSending,
    toggleChatRecording: state.toggleChatRecording,
    addMessage: state.addMessage,
    addScore: state.addScore
  }));
  const toast = useToast();

  const trimmedInput = useMemo(() => chatInput.trim(), [chatInput]);

  const sendMessage = useCallback(async () => {
    if (!started) {
      toast({
        status: 'warning',
        title: 'シナリオを開始してください',
        description: 'シナリオを開始するとチャットが利用できます。'
      });
      return;
    }

    if (!trimmedInput) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmedInput,
      timestamp: new Date().toISOString()
    };

    addMessage(userMessage);
    addScore(scoringMock.score(userMessage));
    setChatInput('');
    setChatSending(true);
    try {
      const reply = await chatMock.reply({
        text: trimmedInput,
        scenarioId: currentScenarioId
      });
      addMessage(reply);
      addScore(scoringMock.score(reply));
    } finally {
      setChatSending(false);
    }
  }, [
    addMessage,
    addScore,
    currentScenarioId,
    setChatInput,
    setChatSending,
    started,
    toast,
    trimmedInput
  ]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  return (
    <Stack spacing={3} as="form" onSubmit={handleSubmit} {...props}>
      <FormControl>
        <FormLabel htmlFor={inputId}>メッセージ入力</FormLabel>
        <Input
          id={inputId}
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力してください"
          isDisabled={!started}
          bgColor={"white"}
        />
      </FormControl>
      <HStack justify="space-between">
        <Tooltip
          label={isChatRecording ? '録音中（ダミー）' : '音声入力（ダミー）'}
          hasArrow
        >
          <Button
            colorScheme={isChatRecording ? 'red' : 'gray'}
            onClick={toggleChatRecording}
            variant={isChatRecording ? 'solid' : 'outline'}
            aria-pressed={isChatRecording}
            bgColor={"white"}
          >
            音声入力
          </Button>
        </Tooltip>
        <Button
          colorScheme="blue"
          rightIcon={<ArrowUpIcon />}
          onClick={sendMessage}
          isLoading={isChatSending}
          isDisabled={!started}
        >
          送信
        </Button>
      </HStack>
    </Stack>
  );
};

export default ChatComposer;
