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
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <>
      {isMobile && (
        <>
          <IconButton
            aria-label={isScenarioOpen ? 'シナリオを閉じる' : 'シナリオを開く'}
            icon={<HamburgerIcon />}
            display={{ base: '', md: !isScenarioOpen ? 'none' : '' }}
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
            <DrawerContent>
              <DrawerHeader borderBottomWidth="1px">シナリオ</DrawerHeader>
              <DrawerBody>{scenarioContent}</DrawerBody>
            </DrawerContent>
          </Drawer>

          <IconButton
            aria-label={isChatOpen ? 'チャットを閉じる' : 'チャットを開く'}
            icon={<ChatIcon />}
            display={{ base: '', md: !isChatOpen ? 'none' : '' }}
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
            <DrawerContent>
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
