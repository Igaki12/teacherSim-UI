import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { ChatIcon, HamburgerIcon, UnlockIcon } from '@chakra-ui/icons';
import { useEffect } from 'react';

const ResponsiveOverlays = ({
  scenarioContent,
  chatContent,
  isScenarioOpen,
  onOpenScenario,
  onCloseScenario,
  isChatOpen,
  onOpenChat,
  onCloseChat,
  onRequestTrainingEnd,
  canEndTraining
}) => {
  const isMobile = useBreakpointValue(
    { base: true, md: false },
    { fallback: 'md' }
  );

  useEffect(() => {
    if (!isMobile) {
      onCloseScenario();
      onCloseChat();
    }
  }, [isMobile, onCloseScenario, onCloseChat]);

  return (
    <>
      {isMobile && (
        <>
          <IconButton
            aria-label={isScenarioOpen ? 'シナリオを閉じる' : 'シナリオを開く'}
            icon={<HamburgerIcon />}
            position="fixed"
            top={4}
            left={4}
            zIndex="popover"
            colorScheme="blue"
            onClick={isScenarioOpen ? onCloseScenario : onOpenScenario}
          />
          <Drawer
            isOpen={isScenarioOpen}
            placement="left"
            onClose={onCloseScenario}
            size="full"
            >
            <DrawerOverlay />
            <DrawerContent
              maxW={{ base: '100%', md: '420px' }}
              w="100%"
              mr="auto"
            >
              <DrawerHeader borderBottomWidth="1px">シナリオ</DrawerHeader>
              <DrawerBody>{scenarioContent}</DrawerBody>
            </DrawerContent>
          </Drawer>

          <IconButton
            aria-label={isChatOpen ? 'チャットを閉じる' : 'チャットを開く'}
            icon={<ChatIcon />}
            position="fixed"
            top={4}
            right={16}
            zIndex="popover"
            colorScheme="pink"
            onClick={isChatOpen ? onCloseChat : onOpenChat}
          />
          <Drawer
            isOpen={isChatOpen}
            placement="right"
            onClose={onCloseChat}
            size="full"
            >
            <DrawerOverlay />
            <DrawerContent
              maxW={{ base: '100%', md: '420px' }}
              w="100%"
              ml="auto"
            >
              <DrawerHeader borderBottomWidth="1px">チャット</DrawerHeader>
              <DrawerBody>{chatContent}</DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}

      <Button
        aria-label="トレーニング終了"
        leftIcon={<UnlockIcon />}
        colorScheme="green"
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        left={{ base: 4, md: 6 }}
        zIndex="popover"
        onClick={onRequestTrainingEnd}
        isDisabled={!canEndTraining}
      >
        トレーニング終了
      </Button>
    </>
  );
};

export default ResponsiveOverlays;
